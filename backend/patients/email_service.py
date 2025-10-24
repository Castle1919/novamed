from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

def send_appointment_confirmation_email(appointment):
    """
    Отправляет пациенту Email с подтверждением записи.
    """
    patient = appointment.patient
    doctor = appointment.doctor
    
    subject = f"Подтверждение записи в NovaMed на {appointment.date_time.strftime('%d.%m.%Y')}"
    
    context = {
        'patient_name': patient.first_name,
        'doctor_name': f"{doctor.last_name} {doctor.first_name}",
        'appointment_date': appointment.date_time.strftime('%d %B %Y г.'),
        'appointment_time': appointment.date_time.strftime('%H:%M'),
        'doctor_specialty': doctor.specialty,
        'room_number': appointment.room_number or doctor.office_number or 'уточняется',
    }
    
    html_message = render_to_string('emails/appointment_confirmation.html', context)
    plain_message = f"Здравствуйте, {context['patient_name']}! Вы успешно записаны к врачу {context['doctor_name']} на {context['appointment_date']} в {context['appointment_time']}."
    
    try:
        send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [patient.user.email], html_message=html_message)
        print(f"Письмо о подтверждении записи отправлено на {patient.user.email}")
    except Exception as e:
        print(f"Ошибка при отправке письма о подтверждении записи: {e}")

def send_reception_summary_email(appointment, medical_record):
    """
    Отправляет пациенту Email с отчетом о приеме.
    """
    patient = appointment.patient
    doctor = appointment.doctor
    
    subject = f"Отчет о приеме у врача от {appointment.date_time.strftime('%d.%m.%Y')}"
    
    prescriptions = medical_record.prescriptions.all()
    
    context = {
        'patient_name': patient.first_name,
        'doctor_name': f"{doctor.last_name} {doctor.first_name}",
        'appointment_date': appointment.date_time.strftime('%d %B %Y г.'),
        'diagnosis': medical_record.diagnosis,
        'recommendations': medical_record.recommendations,
        'prescriptions': prescriptions,
    }
    
    html_message = render_to_string('emails/reception_summary.html', context)
    plain_message = f"Здравствуйте, {context['patient_name']}! Ваш прием завершен. Диагноз: {context['diagnosis']}."
    
    try:
        send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [patient.user.email], html_message=html_message)
        print(f"Письмо с отчетом о приеме отправлено на {patient.user.email}")
    except Exception as e:
        print(f"Ошибка при отправке отчета о приеме: {e}")