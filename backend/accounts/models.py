from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Расширенная модель пользователя с поддержкой ролей
    (Пациент, Доктор) и JWT аутентификацией через email.
    """
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_doctor = models.BooleanField(default=False)
    is_patient = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
