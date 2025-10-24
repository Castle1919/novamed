from django.utils import timezone
from .models import Appointment, Doctor

def cancel_missed_appointments_for_doctor(doctor_id):
    """
    Находит просроченные запланированные записи для КОНКРЕТНОГО врача
    и меняет их статус на "отменено".
    "Просроченной" считается запись, которая была вчера или ранее.
    """
    try:
        doctor = Doctor.objects.get(id=doctor_id)
        
        # Устанавливаем границу на начало сегодняшнего дня в текущем часовом поясе
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        missed_appointments = Appointment.objects.filter(
            doctor=doctor,
            status='scheduled',
            date_time__lt=today_start # Все, что было до начала сегодняшнего дня
        )
        
        count = missed_appointments.update(status='cancelled')
        
        if count > 0:
            print(f"--- [Авто-отмена] Отменено {count} пропущенных записей для Dr. {doctor.last_name}.")
        
        return count
        
    except Doctor.DoesNotExist:
        return 0