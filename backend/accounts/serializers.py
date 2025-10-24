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
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    phone = serializers.CharField(required=True, max_length=20)
    
    specialty = serializers.CharField(required=False, allow_blank=True, write_only=True)
    iin = serializers.CharField(required=False, allow_blank=True, write_only=True)
    is_doctor = serializers.BooleanField(default=False, write_only=True)
    is_patient = serializers.BooleanField(default=False, write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone', 
                    'is_doctor', 'is_patient', 'specialty', 'iin')

    def create(self, validated_data):
        is_doctor = validated_data.get('is_doctor', False)
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            is_active=False,
            is_doctor=is_doctor,
            is_patient=not is_doctor,
            # Сохраняем временные данные
            temp_iin=validated_data.get('iin', None),
            temp_specialty=validated_data.get('specialty', None)
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


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone')

    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Этот email уже используется.")
        return value

    def validate_phone(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(phone=value).exists():
            raise serializers.ValidationError("Этот телефон уже используется.")
        return value