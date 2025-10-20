from rest_framework import serializers
from .models import Patient, Doctor, Medicine, Appointment

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = "__all__"
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def validate_iin(self, value):
        # Ensure IIN is 12 digits
        if value and (not value.isdigit() or len(value) != 12):
            raise serializers.ValidationError('IIN должен содержать 12 цифр')
        # uniqueness is enforced by model, but provide nicer error message
        qs = Patient.objects.filter(iin=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Пациент с таким ИИН уже существует')
        return value

    def validate_phone(self, value):
        if value:
            # basic normalization: remove spaces and dashes
            norm = ''.join(c for c in value if c.isdigit())
            if len(norm) < 9:
                raise serializers.ValidationError('Неверный формат телефона')
            qs = Patient.objects.filter(phone=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('Пациент с таким телефоном уже существует')
        return value


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
        }

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


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = "__all__"