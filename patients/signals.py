from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Patient, Doctor


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance, created, **kwargs):
    """
    Создание Patient или Doctor при регистрации User.
    """
    if created:
        if instance.is_patient:
            Patient.objects.create(user=instance, first_name=instance.username, last_name='')
        if instance.is_doctor:
            Doctor.objects.create(user=instance, first_name=instance.username, last_name='')
