from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, MyTokenObtainPairSerializer, UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from patients.models import Patient
from django.utils import timezone
import random
from datetime import date
import logging

User = get_user_model()


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор токена с добавлением роли пользователя.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = (
            'doctor' if getattr(user, 'is_doctor', False)
            else 'patient' if getattr(user, 'is_patient', False)
            else 'user'
        )
        return token


class RegisterView(generics.CreateAPIView):
    """
    Регистрация нового пользователя.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    """
    Вход пользователя с выдачей JWT токенов.
    """
    serializer_class = MyTokenObtainPairSerializer


class UserDetailView(generics.RetrieveAPIView):
    """
    Просмотр данных текущего пользователя.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class MyTokenObtainPairView(TokenObtainPairView):
    """
    Кастомный view для входа.
    Создает профиль пациента, если его нет.
    """
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        try:
            username = request.data.get('username') or request.data.get('email')
            user = User.objects.filter(username=username).first()
            if not user:
                return response

            # Если пользователь — пациент, создаем профиль при первом входе
            if getattr(user, 'is_patient', False):
                if not Patient.objects.filter(user=user).exists():
                    def gen_iin():
                        return ''.join([str(random.randint(0, 9)) for _ in range(12)])

                    iin = gen_iin()
                    while Patient.objects.filter(iin=iin).exists():
                        iin = gen_iin()

                    Patient.objects.create(
                        user=user,
                        first_name=user.username or 'Пациент',
                        last_name='',
                        birth_date=date(1970, 1, 1),
                        gender='M',
                        iin=iin,
                    )

        except Exception as e:
            logging.exception("Ошибка при создании профиля пациента: %s", e)

        return response




