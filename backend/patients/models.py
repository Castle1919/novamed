from django.db import models
from django.conf import settings
from django.utils import timezone


class Patient(models.Model):
    """
    Модель пациента, связанная с аккаунтом User.
    """
    GENDER_CHOICES = (
        ('M', 'Мужской'),
        ('F', 'Женский'),
    )

    BLOOD_TYPE_CHOICES = (
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    birth_date = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    height = models.FloatField(null=True, blank=True)  # см
    weight = models.FloatField(null=True, blank=True)  # кг
    iin = models.CharField(max_length=12, unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    chronic_diseases = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES, blank=True, null=True)
    insurance_number = models.CharField(max_length=50, blank=True, null=True)
    emergency_contact = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'


class Doctor(models.Model):
    """
    Модель доктора, связанная с аккаунтом User.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    birth_date = models.DateField()
    iin = models.CharField(max_length=12, unique=True)  # ДОБАВЛЕНО: ИИН врача
    specialty = models.CharField(max_length=200)
    experience_years = models.PositiveIntegerField()
    work_phone = models.CharField(max_length=20)  # Сделаем обязательным
    license_number = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    working_hours = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f'Dr. {self.first_name} {self.last_name}'


class Medicine(models.Model):
    """
    Модель препаратов.
    """
    name = models.CharField(max_length=200)
    description = models.TextField()
    prescription_required = models.BooleanField(default=False)
    side_effects = models.TextField(blank=True, null=True)
    contraindications = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Appointment(models.Model):
    """
    Модель посещений (приемов).
    """
    STATUS_CHOICES = (
        ('scheduled', 'Запланировано'),
        ('completed', 'Завершено'),
        ('cancelled', 'Отменено'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date_time = models.DateTimeField(default=timezone.now)
    medicines = models.ManyToManyField(Medicine, blank=True)
    diagnosis = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='scheduled')
    room_number = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f'{self.patient} - {self.doctor} - {self.date_time}'