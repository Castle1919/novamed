from django.conf import settings
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# def send_sms(phone_number, message):
#     """
#     Реальная отправка SMS через Twilio.
#     """
#     if not phone_number or not phone_number.startswith('+'):
#         print(f"ОШИБКА SMS: Неверный формат номера: {phone_number}. Требуется формат +7...")
#         return False

#     try:
#         client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
#         sms = client.messages.create(
#             body=message,
#             from_=settings.TWILIO_PHONE_NUMBER,
#             to=phone_number
#         )
        
#         print(f"SMS успешно отправлено на {phone_number}! SID: {sms.sid}")
#         return True
#     except TwilioRestException as e:
#         print(f"ОШИБКА SMS (Twilio): {e}")
#         return False
#     except Exception as e:
#         print(f"Неизвестная ошибка при отправке SMS: {e}")
#         return False



def send_sms(phone_number, message):
    """
    Функция-заглушка для имитации отправки SMS.
    Печатает красивое сообщение в консоль, имитируя ответ от Twilio.
    """
    import random
    import string
    
    # Генерируем фейковый SID, как у Twilio
    fake_sid = 'SM' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=32))
    
    print("\n" + "="*60)
    print("--- 📲 ИМИТАЦИЯ ОТПРАВКИ SMS (Twilio DEMO) ---")
    print(f"  Статус:         Отправлено")
    print(f"  Получатель:     {phone_number}")
    print(f"  Текст:          {message}")
    print(f"  ID сообщения:   {fake_sid}")
    print("="*60 + "\n")
    
    # Всегда возвращаем True, как будто отправка прошла успешно
    return True