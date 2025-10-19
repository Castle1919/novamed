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
        read_only_fields = ['user']

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = "__all__"

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = "__all__"
