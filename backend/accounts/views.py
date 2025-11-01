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
import logging
import random
from datetime import date
from patients.models import Patient, Doctor
from patients.tasks import cancel_missed_appointments_for_doctor
from patients.sms_service import send_sms
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
import os

User = get_user_model()

# --- ФУНКЦИЯ ОТПРАВКИ ПИСЬМА АКТИВАЦИИ ---
def send_activation_email(user, request):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    frontend_url = os.environ.get('VERCEL_URL', 'http://localhost:3000')
    activation_link = f"{frontend_url}/activate/{uid}/{token}"

    subject = 'Активация аккаунта в NovaMed'
    message = f"""Здравствуйте, {user.first_name or user.username}!

Чтобы активировать ваш аккаунт в NovaMed, перейдите по ссылке:
{activation_link}

С уважением,
Команда NovaMed
"""
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        print(f"Письмо для активации отправлено на {user.email}")
    except Exception as e:
        print(f"ОШИБКА при отправке письма для активации: {e}")

class SendPhoneVerificationCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.phone:
            return Response({'error': 'Сначала укажите и сохраните номер телефона в профиле.'}, status=400)

        # Генерируем простой 6-значный код
        code = str(random.randint(100000, 999999))
        
        # Сохраняем код и время в профиле пользователя
        user.phone_verification_code = code
        user.code_generation_time = timezone.now()
        user.save()
        
        message = f"Ваш код подтверждения для NovaMed: {code}"
        
        if send_sms(user.phone, message):
            return Response({'success': True, 'message': 'Код подтверждения отправлен на ваш номер.'})
        else:
            return Response({'error': 'Не удалось отправить SMS.'}, status=500)

class VerifyPhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get('code')

        if not code:
            return Response({'error': 'Код не предоставлен.'}, status=400)

        # Проверяем, что код еще не "протух" (живет 5 минут)
        if user.code_generation_time is None or (timezone.now() > user.code_generation_time + timedelta(minutes=5)):
            return Response({'error': 'Код устарел. Запросите новый.'}, status=400)

        if user.phone_verification_code == code:
            user.phone_verified = True
            user.phone_verification_code = None # Очищаем код после использования
            user.code_generation_time = None
            user.save()
            
            return Response({
                'success': True,
                'message': 'Номер телефона успешно подтвержден!',
            })
        else:
            return Response({'error': 'Неверный код подтверждения.'}, status=400)


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
                
                # Создаем профиль в зависимости от роли, используя временные данные
                if user.is_patient and not hasattr(user, 'patient'):
                    Patient.objects.create(
                        user=user, 
                        first_name=user.first_name, 
                        last_name=user.last_name,
                        birth_date=date(2000, 1, 1),
                        gender='M',
                        iin=user.temp_iin or ''.join([str(random.randint(0, 9)) for _ in range(12)])
                    )
                elif user.is_doctor and not hasattr(user, 'doctor'):
                    Doctor.objects.create(
                        user=user, 
                        first_name=user.first_name, 
                        last_name=user.last_name,
                        birth_date=date(1990, 1, 1), 
                        iin=''.join([str(random.randint(0, 9)) for _ in range(12)]),
                        specialty=user.temp_specialty or 'Терапевт',
                        experience_years=1
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
    
# Простой сериализатор только для телефона
class PhoneUpdateSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        # Проверяем уникальность, исключая текущего пользователя
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(phone=value).exists():
            raise serializers.ValidationError("Этот номер телефона уже используется.")
        return value

class UpdatePhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        
        print("\n--- UPDATE PHONE DEBUG ---")
        print("Request data:", request.data)
        
        serializer = PhoneUpdateSerializer(data=request.data, context={'request': request})
        
        is_valid = serializer.is_valid()
        print("Is valid:", is_valid)
        
        if not is_valid:
            print("Validation Errors:", serializer.errors)
        
        print("--------------------------\n")
        
        if is_valid:
            user.phone = serializer.validated_data['phone']
            user.phone_verified = False
            user.save()
            return Response({'success': True, 'phone': user.phone})
        
        return Response(serializer.errors, status=400)