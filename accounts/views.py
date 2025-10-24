from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import RegisterSerializer, UserSerializer
from patients.models import Patient
import logging
import random
from datetime import date
from patients.models import Patient, Doctor
from patients.tasks import cancel_missed_appointments_for_doctor

User = get_user_model()

# --- ФУНКЦИЯ ОТПРАВКИ ПИСЬМА АКТИВАЦИИ ---
def send_activation_email(user, request):
    """
    Формирует и отправляет письмо для активации аккаунта через настроенный EMAIL_BACKEND.
    """
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    frontend_url = 'http://localhost:3000'
    activation_link = f"{frontend_url}/activate/{uid}/{token}"

    subject = 'Активация аккаунта в NovaMed'
    message = f"""Здравствуйте, {user.first_name or user.username}!

Чтобы активировать ваш аккаунт в NovaMed, перейдите по ссылке:
{activation_link}

Если вы не регистрировались, просто проигнорируйте это письмо.

С уважением,
Команда NovaMed
"""
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        print(f"Письмо для активации отправлено на {user.email}")
    except Exception as e:
        print(f"ОШИБКА при отправке письма для активации: {e}")


# --- VIEWS ДЛЯ РЕГИСТРАЦИИ И АКТИВАЦИИ ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save(is_active=False, is_patient=True)
        send_activation_email(user, self.request)

class ActivateUserView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            if not user.is_active:
                user.is_active = True
                user.email_verified = True
                user.save()
                
                if not Patient.objects.filter(user=user).exists():
                    Patient.objects.create(
                        user=user, first_name=user.first_name, last_name=user.last_name,
                        birth_date=date(2000, 1, 1), gender='M',
                        iin=''.join([str(random.randint(0, 9)) for _ in range(12)])
                    )
                return Response({'success': True, 'message': 'Аккаунт успешно активирован!'})
            else:
                return Response({'success': True, 'message': 'Аккаунт уже был активирован.'})
        else:
            return Response({'success': False, 'message': 'Ссылка для активации недействительна.'}, status=400)


# --- VIEWS ДЛЯ ВХОДА И ПРОФИЛЯ ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = 'doctor' if user.is_doctor else 'patient'
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        if not self.user.is_active:
            raise serializers.ValidationError("Пожалуйста, активируйте ваш аккаунт, проверив почту.")
        
        # --- ЗАПУСК ОЧИСТКИ ПРИ ВХОДЕ ВРАЧА ---
        if self.user.is_doctor:
            try:
                # Убедимся, что профиль доктора существует
                doctor = self.user.doctor 
                cancel_missed_appointments_for_doctor(doctor.id)
            except Doctor.DoesNotExist:
                print(f"Профиль врача для пользователя {self.user.id} не найден, очистка пропущена.")
            except Exception as e:
                print(f"Не удалось запустить очистку для врача {self.user.id}: {e}")
        # --- КОНЕЦ БЛОКА ---
            
        data['email'] = self.user.email
        data['role'] = 'doctor' if self.user.is_doctor else 'patient'
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class LoginView(MyTokenObtainPairView):
    """
    Вход пользователя (алиас для MyTokenObtainPairView).
    """
    pass

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user