from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Расширенная модель пользователя с поддержкой ролей
    (Пациент, Доктор) и JWT аутентификацией через email.
    """
    email = models.EmailField(_('email address'), unique=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_doctor = models.BooleanField(default=False)
    is_patient = models.BooleanField(default=True)
    
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name='Телефон')
    phone_verified = models.BooleanField(default=False, verbose_name='Телефон подтвержден')
    phone_verification_code = models.CharField(max_length=6, blank=True, null=True, verbose_name='Код подтверждения телефона')
    code_generation_time = models.DateTimeField(blank=True, null=True, verbose_name='Время генерации кода')

    
    email = models.EmailField(unique=True, verbose_name='Email')
    email_verified = models.BooleanField(default=False, verbose_name='Email подтвержден')
    
    otp_secret = models.CharField(max_length=32, blank=True, null=True, verbose_name='Секрет для OTP')

    temp_iin = models.CharField(max_length=12, blank=True, null=True)
    temp_specialty = models.CharField(max_length=200, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
