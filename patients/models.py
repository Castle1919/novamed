from django.db import models
from django.conf import settings
from django.utils import timezone


class Patient(models.Model):
    """
    Модель пациента, связанная с аккаунтом User.
    """
    class Meta:
        verbose_name = 'Пациент'
        verbose_name_plural = 'Пациенты'
        
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

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='Пользователь')
    first_name = models.CharField(max_length=100, verbose_name='Имя')
    last_name = models.CharField(max_length=100, verbose_name='Фамилия')
    birth_date = models.DateField(verbose_name='Дата рождения')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name='Пол')
    height = models.FloatField(null=True, blank=True, verbose_name='Рост (см)')
    weight = models.FloatField(null=True, blank=True, verbose_name='Вес (кг)')
    iin = models.CharField(max_length=12, unique=True, verbose_name='ИИН')
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name='Телефон')
    chronic_diseases = models.TextField(blank=True, null=True, verbose_name='Хронические заболевания')
    allergies = models.TextField(blank=True, null=True, verbose_name='Аллергии')
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES, blank=True, null=True, verbose_name='Группа крови')
    insurance_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Номер страховки')
    emergency_contact = models.CharField(max_length=50, blank=True, null=True, verbose_name='Экстренный контакт')

    def __str__(self):
        return f'{self.first_name} {self.last_name}'


class Doctor(models.Model):
    """
    Модель доктора, связанная с аккаунтом User.
    """
    class Meta:
        verbose_name = 'Врач'
        verbose_name_plural = 'Врачи'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='Пользователь')
    first_name = models.CharField(max_length=100, verbose_name='Имя')
    last_name = models.CharField(max_length=100, verbose_name='Фамилия')
    birth_date = models.DateField(verbose_name='Дата рождения')
    iin = models.CharField(max_length=12, unique=True, verbose_name='ИИН')
    specialty = models.CharField(max_length=200, verbose_name='Специализация')
    experience_years = models.PositiveIntegerField(verbose_name='Стаж (лет)')
    work_phone = models.CharField(max_length=20, verbose_name='Рабочий телефон')
    license_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Номер лицензии')
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name='Отделение')
    working_hours = models.CharField(max_length=100, blank=True, null=True, verbose_name='Часы работы')
    office_number = models.CharField(max_length=10, blank=True, null=True, verbose_name='Номер кабинета')

    def __str__(self):
        return f'Dr. {self.first_name} {self.last_name}'


class Medicine(models.Model):
    """
    Модель препаратов.
    """
    class Meta:
        verbose_name = 'Препарат'
        verbose_name_plural = 'Препараты'
        
    name = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    prescription_required = models.BooleanField(default=False, verbose_name='Требуется рецепт')
    side_effects = models.TextField(blank=True, null=True, verbose_name='Побочные эффекты')
    contraindications = models.TextField(blank=True, null=True, verbose_name='Противопоказания')

    def __str__(self):
        return self.name


class Appointment(models.Model):
    """
    Модель посещений (приемов).
    """
    class Meta:
        verbose_name = 'Запись на приём'
        verbose_name_plural = 'Записи на приём'
        
    STATUS_CHOICES = (
        ('scheduled', 'Запланировано'),
        ('completed', 'Завершено'),
        ('cancelled', 'Отменено'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments', verbose_name='Пациент')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments', verbose_name='Врач')
    date_time = models.DateTimeField(default=timezone.now, verbose_name='Дата и время')
    medicines = models.ManyToManyField(Medicine, blank=True, verbose_name='Лекарства')
    diagnosis = models.TextField(blank=True, null=True, verbose_name='Диагноз')
    notes = models.TextField(blank=True, null=True, verbose_name='Примечания')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='scheduled', verbose_name='Статус')
    room_number = models.CharField(max_length=10, blank=True, null=True, verbose_name='Номер кабинета')

    def __str__(self):
        local_time = timezone.localtime(self.date_time)
        return f'{self.patient.last_name} {self.patient.first_name} - Dr. {self.doctor.last_name} {self.doctor.first_name} - {local_time.strftime("%Y-%m-%d %H:%M")}'
    
class MedicalRecord(models.Model):
    """
    Медицинская запись (результат приема)
    """
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='medical_record')
    
    # Анамнез
    complaints = models.TextField(blank=True, null=True, verbose_name='Жалобы пациента')
    anamnesis = models.TextField(blank=True, null=True, verbose_name='Анамнез заболевания')
    objective_data = models.TextField(blank=True, null=True, verbose_name='Объективные данные')
    
    # Диагноз
    diagnosis = models.TextField(verbose_name='Диагноз')
    
    # Назначения
    recommendations = models.TextField(blank=True, null=True, verbose_name='Рекомендации')
    
    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Медицинская запись'
        verbose_name_plural = 'Медицинские записи'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Запись приема #{self.appointment.id} - {self.appointment.patient}'


class Prescription(models.Model):
    """
    Рецепт (назначение лекарств)
    """
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='prescriptions')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    
    dosage = models.CharField(max_length=100, verbose_name='Дозировка') 
    frequency = models.CharField(max_length=100, verbose_name='Частота приема')
    duration = models.CharField(max_length=100, verbose_name='Длительность')
    instructions = models.TextField(blank=True, null=True, verbose_name='Дополнительные указания')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Рецепт'
        verbose_name_plural = 'Рецепты'
    
    def __str__(self):
        return f'{self.medicine.name} - {self.dosage}'


class DoctorNote(models.Model):
    """
    Приватные заметки врача (не видны пациенту)
    """
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='doctor_notes')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    note = models.TextField(verbose_name='Заметка')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Заметка врача'
        verbose_name_plural = 'Заметки врача'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Заметка от {self.created_at.strftime("%d.%m.%Y")}'


class DiagnosisTemplate(models.Model):
    """
    Шаблоны диагнозов (часто используемые)
    """
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='diagnosis_templates')
    name = models.CharField(max_length=200, verbose_name='Название')
    diagnosis = models.TextField(verbose_name='Диагноз')
    recommendations = models.TextField(blank=True, null=True, verbose_name='Рекомендации')
    
    created_at = models.DateTimeField(auto_now_add=True)
    usage_count = models.PositiveIntegerField(default=0, verbose_name='Количество использований')
    
    class Meta:
        verbose_name = 'Шаблон диагноза'
        verbose_name_plural = 'Шаблоны диагнозов'
        ordering = ['-usage_count', 'name']
    
    def __str__(self):
        return self.name


class PatientFile(models.Model):
    """
    Файлы пациента (анализы, снимки)
    """
    FILE_TYPES = (
        ('analysis', 'Анализ'),
        ('xray', 'Рентген'),
        ('mri', 'МРТ'),
        ('ct', 'КТ'),
        ('ultrasound', 'УЗИ'),
        ('other', 'Другое'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='files')
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='files')
    
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    file = models.FileField(upload_to='patient_files/%Y/%m/')
    title = models.CharField(max_length=255, verbose_name='Название', default='Документ')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        verbose_name = 'Файл пациента'
        verbose_name_plural = 'Файлы пациента'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f'{self.get_file_type_display()} - {self.title}'