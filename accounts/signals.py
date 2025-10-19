from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    """
    Сигнал для автоматических действий при создании пользователя.
    """
    if created and instance.is_patient:
        print(f'Создан пациент: {instance.email}')
