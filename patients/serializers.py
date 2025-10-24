from rest_framework import serializers
from .models import *
from accounts.models import *
from django.utils import timezone
from datetime import datetime, timedelta
from accounts.models import User

# Сериализатор для обновления User внутри другого профиля
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'phone', 'phone_verified')
        read_only_fields = ('phone_verified',)

class PatientSerializer(serializers.ModelSerializer):
    user = UserProfileUpdateSerializer(read_only=True) 

    class Meta:
        model = Patient
        fields = (
            'id', 'user', 'first_name', 'last_name', 'birth_date', 'gender', 
            'height', 'weight', 'iin', 'chronic_diseases', 'allergies', 
            'blood_type', 'insurance_number', 'emergency_contact'
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_serializer = UserProfileUpdateSerializer(instance.user, data=user_data, partial=True)
            if user_serializer.is_valid(raise_exception=True):
                user_serializer.save()

        return super().update(instance, validated_data)


class DoctorSerializer(serializers.ModelSerializer):
    user = UserProfileUpdateSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = (
            'id', 'user', 'first_name', 'last_name', 'birth_date', 'iin', 
            'specialty', 'experience_years', 'work_phone', 'license_number', 
            'department', 'working_hours', 'office_number'
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_serializer = UserProfileUpdateSerializer(instance.user, data=user_data, partial=True)
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()
        return super().update(instance, validated_data)

    def validate_iin(self, value):
        """Валидация ИИН врача"""
        if not value:
            raise serializers.ValidationError('ИИН обязателен для заполнения')
        
        # Убираем пробелы
        value = value.strip()
        
        # Проверяем что это только цифры
        if not value.isdigit():
            raise serializers.ValidationError('ИИН должен содержать только цифры')
        
        # Проверяем длину
        if len(value) != 12:
            raise serializers.ValidationError('ИИН должен содержать ровно 12 цифр')
        
        # Проверяем уникальность (исключая текущий объект при обновлении)
        qs = Doctor.objects.filter(iin=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Врач с таким ИИН уже зарегистрирован')
        
        return value

    def validate_experience_years(self, value):
        """Валидация стажа работы"""
        if value is None:
            raise serializers.ValidationError('Стаж работы обязателен для заполнения')
        
        if value < 0:
            raise serializers.ValidationError('Стаж не может быть отрицательным')
        
        if value > 70:
            raise serializers.ValidationError('Стаж не может превышать 70 лет')
        
        return value

    def validate_work_phone(self, value):
        """Валидация рабочего телефона"""
        if not value:
            raise serializers.ValidationError('Рабочий телефон обязателен для заполнения')
        
        # Убираем все символы кроме цифр
        digits_only = ''.join(c for c in value if c.isdigit())
        
        if len(digits_only) < 10:
            raise serializers.ValidationError('Телефон должен содержать минимум 10 цифр')
        
        if len(digits_only) > 15:
            raise serializers.ValidationError('Телефон не может содержать более 15 цифр')
        
        return value
    
    def validate_first_name(self, value):
        """Валидация имени"""
        if not value or not value.strip():
            raise serializers.ValidationError('Имя обязательно для заполнения')
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Имя должно содержать минимум 2 символа')
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError('Имя не может быть длиннее 100 символов')
        
        return value.strip()
    
    def validate_last_name(self, value):
        """Валидация фамилии"""
        if not value or not value.strip():
            raise serializers.ValidationError('Фамилия обязательна для заполнения')
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Фамилия должна содержать минимум 2 символа')
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError('Фамилия не может быть длиннее 100 символов')
        
        return value.strip()
    
    def validate_specialty(self, value):
        """Валидация специальности"""
        if not value or not value.strip():
            raise serializers.ValidationError('Специальность обязательна для заполнения')
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Специальность должна содержать минимум 3 символа')
        
        return value.strip()
    
    def validate_birth_date(self, value):
        """Валидация даты рождения"""
        if not value:
            raise serializers.ValidationError('Дата рождения обязательна для заполнения')
        
        from datetime import date
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 22:
            raise serializers.ValidationError('Врач должен быть старше 22 лет')
        
        if age > 100:
            raise serializers.ValidationError('Некорректная дата рождения')
        
        return value
    
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_serializer = UserProfileUpdateSerializer(instance.user, data=user_data, partial=True)
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()
        return super().update(instance, validated_data)


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = "__all__"
        

class AppointmentListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка записей с информацией о пациенте и враче"""
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    doctor_specialty = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name', 
            'doctor_specialty', 'date_time', 'status', 'room_number', 
            'notes', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}"
    
    def get_doctor_specialty(self, obj):
        return obj.doctor.specialty


class AppointmentDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор записи"""
    patient_details = serializers.SerializerMethodField()
    doctor_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
    
    def get_patient_details(self, obj):
        return {
            'id': obj.patient.id,
            'name': f"{obj.patient.first_name} {obj.patient.last_name}",
            'phone': obj.patient.phone,
            'birth_date': obj.patient.birth_date,
            'gender': obj.patient.gender,
            'chronic_diseases': obj.patient.chronic_diseases,
            'allergies': obj.patient.allergies,
        }
    
    def get_doctor_details(self, obj):
        return {
            'id': obj.doctor.id,
            'name': f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}",
            'specialty': obj.doctor.specialty,
            'department': obj.doctor.department,
        }


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания записи пациентом"""
    
    class Meta:
        model = Appointment
        fields = ['doctor', 'date_time', 'notes']
    
    def validate_date_time(self, value):
        """Валидация даты и времени записи"""
        # Проверка что дата в будущем
        if value <= timezone.now():
            raise serializers.ValidationError(
                'Дата и время записи должны быть в будущем'
            )
        
        # Проверка что не более чем на 3 месяца вперед
        max_date = timezone.now() + timedelta(days=90)
        if value > max_date:
            raise serializers.ValidationError(
                'Нельзя записаться более чем на 3 месяца вперед'
            )
        
        # Проверка что это рабочее время (8:00 - 18:00)
        hour = value.hour
        if hour < 8 or hour >= 18:
            raise serializers.ValidationError(
                'Запись возможна только в рабочее время (с 8:00 до 18:00)'
            )
        
        # Проверка что это не выходной (суббота или воскресенье)
        if value.weekday() in [5, 6]:
            raise serializers.ValidationError(
                'Запись на выходные дни недоступна'
            )
        
        # Проверка интервалов (только каждые 30 минут)
        if value.minute not in [0, 30]:
            raise serializers.ValidationError(
                'Запись возможна только на :00 или :30 минут'
            )
        
        return value
    
    def validate(self, data):
        """Общая валидация"""
        doctor = data.get('doctor')
        date_time = data.get('date_time')
        
        # Проверка что врач существует и активен
        if not doctor:
            raise serializers.ValidationError(
                {'doctor': 'Врач должен быть указан'}
            )
        
        # Проверка доступности врача (нет других записей на это время)
        existing_appointments = Appointment.objects.filter(
            doctor=doctor,
            date_time=date_time,
            status__in=['scheduled', 'completed']  # Не учитываем отмененные
        )
        
        if existing_appointments.exists():
            raise serializers.ValidationError(
                {'date_time': 'Это время уже занято. Выберите другое время.'}
            )
        
        return data
    
    def create(self, validated_data):
        """Создание записи"""
        # Получаем пациента из контекста (request.user)
        request = self.context.get('request')
        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            raise serializers.ValidationError(
                'Профиль пациента не найден. Создайте профиль перед записью.'
            )
        
        # Автоматически назначаем кабинет (можно улучшить логику)
        room_number = self._assign_room(validated_data['doctor'])
        
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=validated_data['doctor'],
            date_time=validated_data['date_time'],
            notes=validated_data.get('notes', ''),
            room_number=room_number,
            status='scheduled'
        )
        
        return appointment
    
    def _assign_room(self, doctor):
        """Автоматическое назначение кабинета"""
        # Можно улучшить логику распределения кабинетов
        if doctor.department:
            # Простая логика: номер кабинета = hash от отделения % 100 + 100
            return str(hash(doctor.department) % 100 + 100)
        return '101'  # Кабинет по умолчанию


class AvailableSlotsSerializer(serializers.Serializer):
    """Сериализатор для получения доступных слотов"""
    doctor_id = serializers.IntegerField()
    date = serializers.DateField()
    
    def validate_date(self, value):
        """Валидация даты"""
        if value < timezone.now().date():
            raise serializers.ValidationError('Дата не может быть в прошлом')
        
        max_date = (timezone.now() + timedelta(days=90)).date()
        if value > max_date:
            raise serializers.ValidationError(
                'Нельзя просмотреть расписание более чем на 3 месяца вперед'
            )
        
        return value
    
