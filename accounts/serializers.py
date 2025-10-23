from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from patients.models import Patient, Doctor, Medicine, Appointment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели User."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_doctor', 'is_patient', 'phone', 'avatar']



class RegisterSerializer(serializers.ModelSerializer):
    """
    Сериализатор для регистрации нового пользователя с активацией по email.
    """
    password = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=False
        )
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Добавляем роль пользователя в токен
        token['is_doctor'] = user.is_doctor
        token['is_patient'] = user.is_patient
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Добавляем данные пользователя в ответ
        data['email'] = self.user.email
        data['role'] = 'doctor' if self.user.is_doctor else 'patient'
        return data
