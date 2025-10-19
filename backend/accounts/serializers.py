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
    """Сериализатор для регистрации нового пользователя."""
    password = serializers.CharField(write_only=True)
    # Optional patient profile fields
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    birth_date = serializers.DateField(write_only=True, required=False)
    gender = serializers.ChoiceField(write_only=True, choices=(('M', 'M'), ('F', 'F')), required=False)
    iin = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'is_doctor', 'is_patient']

    def create(self, validated_data):
        # Extract patient-related data if present
        patient_data = {
            'first_name': validated_data.pop('first_name', None),
            'last_name': validated_data.pop('last_name', None),
            'birth_date': validated_data.pop('birth_date', None),
            'gender': validated_data.pop('gender', None),
            'iin': validated_data.pop('iin', None),
            'phone': validated_data.pop('phone', None),
        }

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
        )
        user.is_doctor = validated_data.get('is_doctor', False)
        user.is_patient = validated_data.get('is_patient', False)
        user.save()

        # If registering as patient and patient_data has required fields, create Patient
        if user.is_patient:
            # ensure required fields for Patient exist (first_name,last_name,birth_date,iin)
            try:
                if patient_data.get('first_name') and patient_data.get('last_name') and patient_data.get('birth_date') and patient_data.get('iin'):
                    Patient.objects.create(
                        user=user,
                        first_name=patient_data.get('first_name'),
                        last_name=patient_data.get('last_name'),
                        birth_date=patient_data.get('birth_date'),
                        gender=patient_data.get('gender') or 'M',
                        iin=patient_data.get('iin'),
                        phone=patient_data.get('phone'),
                    )
            except Exception:
                # If patient creation fails, we still return created user; client should handle incomplete profile
                pass

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
