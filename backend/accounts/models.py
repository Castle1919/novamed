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
    
    
    email = models.EmailField(unique=True, verbose_name='Email')
    email_verified = models.BooleanField(default=False, verbose_name='Email подтвержден')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
