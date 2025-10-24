from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta, time, date
from django.utils.dateparse import parse_date
from django.utils.dateparse import parse_datetime
from django.db.models import Count, Q, Case, When, Value, IntegerField, CharField
from .sms_service import send_sms
from .email_service import send_appointment_confirmation_email
from .email_service import send_reception_summary_email
from .models import (
    Patient, 
    Doctor,
    Medicine,
    Appointment,
    MedicalRecord,
    Prescription,
    PatientFile,
    DoctorNote,
    DiagnosisTemplate,
    PatientActiveMedicine,
    )
from .serializers import (
    PatientSerializer,
    DoctorSerializer,
    MedicineSerializer,
    AppointmentSerializer,
    AppointmentListSerializer,
    AppointmentDetailSerializer,
    
)




# ===== CUSTOM PERMISSIONS =====
class IsDoctorUser(permissions.BasePermission):
    """Доступ только для врачей"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_doctor', False)


# ===== PATIENTS =====
class PatientListView(generics.ListCreateAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        user = self.request.user
        if user.is_staff or getattr(user, 'is_doctor', False):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_doctor', False):
            return Patient.objects.all()
        elif getattr(user, 'is_patient', False):
            return Patient.objects.filter(user=user)
        return Patient.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PatientDetailView(generics.RetrieveUpdateAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        # Обновляем данные User отдельно
        user_data = self.request.data.get('user')
        if user_data:
            user = serializer.instance.user
            user.email = user_data.get('email', user.email)
            user.phone = user_data.get('phone', user.phone)
            user.save()
        
        # Сохраняем остальные данные Patient
        serializer.save()


class MyPatientView(generics.RetrieveUpdateAPIView):
    """Получить или обновить профиль текущего пациента"""
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            patient = Patient.objects.select_related('user').get(user=request.user)
            serializer = PatientSerializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response({"error": "Профиль пациента не найден"}, status=404)
        

class MyDoctorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            doctor = Doctor.objects.select_related('user').get(user=request.user)
            serializer = DoctorSerializer(doctor)
            return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response({"error": "Профиль врача не найден"}, status=404)

    def patch(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
            serializer = DoctorSerializer(doctor, data=request.data, partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response({"error": "Профиль врача не найден"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def get_object(self):
        user = self.request.user
        
        # Проверяем, что пользователь - врач
        if not getattr(user, 'is_doctor', False):
            raise PermissionDenied("Текущий пользователь не является врачом")
        
        try:
            return Doctor.objects.get(user=user)
        except Doctor.DoesNotExist:
            # Возвращаем 404, фронтенд обработает это и предложит создать профиль
            raise NotFound("Профиль врача не найден")

    def put(self, request, *args, **kwargs):
        """PUT запрос - обновить или создать профиль"""
        user = request.user
        
        if not getattr(user, 'is_doctor', False):
            return Response(
                {"detail": "Текущий пользователь не является врачом"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Пытаемся найти существующий профиль
            doctor = Doctor.objects.get(user=user)
            serializer = self.get_serializer(doctor, data=request.data)
        except Doctor.DoesNotExist:
            # Если профиля нет - создаем новый
            serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        
        # Сохраняем с привязкой к пользователю
        doctor = serializer.save(user=user)
        
        return Response(serializer.data, status=status.HTTP_200_OK)



class PatientMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            patient = Patient.objects.get(user=request.user)
            serializer = PatientSerializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response({'error': 'Пациент не найден'}, status=status.HTTP_404_NOT_FOUND)


# ===== DOCTORS =====
class DoctorListView(generics.ListAPIView):
    """
    Список всех врачей (публичный или для пациентов)
    """
    queryset = Doctor.objects.all()
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []
        
        for doctor in queryset:
            doctor_data = {
                'id': doctor.id,
                'first_name': doctor.first_name,
                'last_name': doctor.last_name,
                'specialty': doctor.specialty,  # Правильное поле
                'specialization': doctor.specialty,  # Алиас для совместимости
                'experience_years': doctor.experience_years,
                'work_phone': doctor.work_phone,
                'department': doctor.department or '',
                'working_hours': doctor.working_hours or '',
                'office_number': '',  # У Doctor нет office_number
            }
            
            # Добавляем аватар если есть
            if hasattr(doctor.user, 'avatar') and doctor.user.avatar:
                doctor_data['avatar'] = request.build_absolute_uri(doctor.user.avatar.url)
            
            data.append(doctor_data)
        
        return Response({'results': data})



class DoctorDetailView(generics.RetrieveUpdateAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        user_data = self.request.data.get('user')
        if user_data:
            user = serializer.instance.user
            user.email = user_data.get('email', user.email)
            user.phone = user_data.get('phone', user.phone)
            user.save()
        serializer.save()


class DoctorMeView(APIView):
    """Просмотр профиля текущего доктора"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
            serializer = DoctorSerializer(doctor)
            return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response({'error': 'Доктор не найден'}, status=status.HTTP_404_NOT_FOUND)


# ===== MEDICINES =====
class MedicineListView(generics.ListAPIView):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [permissions.IsAuthenticated]


class MedicineDetailView(generics.RetrieveAPIView):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [permissions.IsAuthenticated]


# ===== APPOINTMENTS =====
class AppointmentListView(generics.ListCreateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]


# ===== UNIQUE CHECK =====
class PatientUniqueCheckView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        iin = request.query_params.get('iin')
        phone = request.query_params.get('phone')
        if iin:
            exists = Patient.objects.filter(iin=iin).exists()
            return Response({'field': 'iin', 'exists': exists})
        if phone:
            exists = Patient.objects.filter(phone=phone).exists()
            return Response({'field': 'phone', 'exists': exists})
        return Response({'detail': 'Укажите параметр iin или phone'}, status=400)
    
    
# # --- VIEWS ДЛЯ ВХОДА И ПРОФИЛЯ ---
# class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)
#         token['role'] = 'doctor' if user.is_doctor else 'patient'
#         return token

#     def validate(self, attrs):
#         data = super().validate(attrs)
        
#         if not self.user.is_active:
#             raise serializers.ValidationError("Пожалуйста, активируйте ваш аккаунт, проверив почту.")
        
#         # --- ЗАПУСК ОЧИСТКИ ПРИ ВХОДЕ ВРАЧА ---
#         if self.user.is_doctor:
#             try:
#                 # Убедимся, что профиль доктора существует
#                 doctor = self.user.doctor 
#                 cancel_missed_appointments_for_doctor(doctor.id)
#             except Doctor.DoesNotExist:
#                 print(f"Профиль врача для пользователя {self.user.id} не найден, очистка пропущена.")
#             except Exception as e:
#                 print(f"Не удалось запустить очистку для врача {self.user.id}: {e}")
#         # --- КОНЕЦ БЛОКА ---
            
#         data['email'] = self.user.email
#         data['role'] = 'doctor' if self.user.is_doctor else 'patient'
#         return data


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def doctor_profile_view(request):
    """
    Получение и обновление профиля доктора (по текущему пользователю)
    GET - получить профиль
    PUT - полное обновление или создание
    PATCH - частичное обновление или создание
    """
    user = request.user
    
    # Проверяем, что пользователь - врач
    if not getattr(user, 'is_doctor', False):
        return Response(
            {"detail": "Текущий пользователь не является врачом"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        try:
            doctor = Doctor.objects.get(user=user)
            serializer = DoctorSerializer(doctor)
            return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response(
                {"detail": "Профиль врача не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    elif request.method in ['PUT', 'PATCH']:
        try:
            doctor = Doctor.objects.get(user=user)
            serializer = DoctorSerializer(
                doctor, 
                data=request.data, 
                partial=(request.method == 'PATCH')
            )
        except Doctor.DoesNotExist:
            # Создаем новый профиль
            serializer = DoctorSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class AppointmentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Только пациенты могут создавать записи'
            }, status=403)
        
        doctor_id = request.data.get('doctor')
        date_time_str = request.data.get('date_time')
        notes = request.data.get('notes', '')
        
        if not doctor_id or not date_time_str:
            return Response({
                'success': False,
                'message': 'Не указаны обязательные поля'
            }, status=400)
        
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'success': False, 'message': 'Врач не найден'}, status=404)
        
        appointment_datetime = parse_datetime(date_time_str)
        if not appointment_datetime:
            return Response({'success': False, 'message': 'Неверный формат даты'}, status=400)
        
        if timezone.is_naive(appointment_datetime):
            current_tz = timezone.get_current_timezone()
            appointment_datetime = timezone.make_aware(appointment_datetime, current_tz)
        
        existing = Appointment.objects.filter(
            doctor=doctor,
            date_time=appointment_datetime,
            status='scheduled'
        ).exists()
        
        if existing:
            return Response({'success': False, 'message': 'Это время уже занято'}, status=400)
        
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            date_time=appointment_datetime,
            notes=notes,
            status='scheduled',
            room_number=doctor.office_number
        )
        send_appointment_confirmation_email(appointment)

        
        return Response({
            'success': True,
            'message': 'Запись успешно создана',
            'appointment': {
                'id': appointment.id,
                'date_time': appointment.date_time.isoformat(),
                'status': appointment.status,
                'notes': appointment.notes,
                'doctor_details': {
                    'id': doctor.id,
                    'name': f"{doctor.last_name} {doctor.first_name}",
                    'specialization': doctor.specialty,
                    'office_number': appointment.room_number,
                    'phone': doctor.work_phone,
                }
            }
        })

class MyAppointmentsView(APIView):
    """
    Получить записи текущего пользователя (пациента или врача)
    с правильной сортировкой и "ленивой" отменой для пациента.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        date_str = request.query_params.get('date')
        
        # 1. Если зашел ВРАЧ
        try:
            doctor = Doctor.objects.get(user=request.user)
            
            queryset = Appointment.objects.filter(doctor=doctor)
            if date_str:
                target_date = parse_date(date_str)
                if target_date:
                    queryset = queryset.filter(date_time__date=target_date)

            # Сортировка для врача: сначала 'scheduled', потом остальные, и по времени
            appointments = queryset.select_related('patient', 'patient__user').annotate(
                status_order=Case(
                    When(status='scheduled', then=Value(1)),
                    default=Value(2),
                    output_field=IntegerField()
                )
            ).order_by('status_order', 'date_time')
            
            data = []
            for apt in appointments:
                # ... (ваш код сериализации для врача без изменений) ...
                # ... (я скопирую его из вашего предыдущего ответа) ...
                age = None
                if apt.patient.birth_date:
                    today = date.today()
                    born = apt.patient.birth_date
                    age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
                patient_data = {
                    'id': apt.patient.id, 'first_name': apt.patient.first_name, 'last_name': apt.patient.last_name,
                    'phone': apt.patient.user.phone or '', 'age': age, 'gender': apt.patient.get_gender_display(), 'iin': apt.patient.iin,
                }
                data.append({
                    'id': apt.id, 'date_time': apt.date_time.isoformat(), 'status': apt.status,
                    'notes': apt.notes or '', 'diagnosis': apt.diagnosis or '',
                    'room_number': apt.room_number or '', 'patient': apt.patient.id,
                    'patient_details': patient_data
                })
            return Response(data)
            
        except Doctor.DoesNotExist:
            pass # Если не врач, идем дальше
        
        # 2. Если зашел ПАЦИЕНТ
        try:
            patient = Patient.objects.get(user=request.user)
            
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            appointments = Appointment.objects.filter(patient=patient).select_related('doctor').annotate(
                # Вычисляем статус "на лету"
                effective_status=Case(
                    When(Q(status='scheduled') & Q(date_time__lt=today_start), then=Value('cancelled')),
                    default='status',
                    output_field=CharField()
                ),
                # Сортируем по вычисленному статусу
                status_order=Case(
                    When(effective_status='scheduled', then=Value(1)),
                    When(effective_status='completed', then=Value(2)),
                    default=Value(3),
                    output_field=IntegerField()
                )
            ).order_by('status_order', '-date_time')
            
            data = []
            for apt in appointments:
                data.append({
                    'id': apt.id,
                    'date_time': apt.date_time.isoformat(),
                    'status': apt.effective_status, # <-- Используем вычисленный статус
                    'notes': apt.notes or '',
                    'diagnosis': apt.diagnosis or '',
                    'room_number': apt.room_number or '',
                    'doctor': apt.doctor.id,
                    'doctor_details': {
                        'id': apt.doctor.id,
                        'name': f"{apt.doctor.last_name} {apt.doctor.first_name}",
                        'specialization': apt.doctor.specialty,
                        'office_number': apt.room_number or getattr(apt.doctor, 'office_number', ''),
                        'phone': apt.doctor.work_phone or '',
                        'experience_years': apt.doctor.experience_years,
                    }
                })
            return Response(data)
            
        except Patient.DoesNotExist:
            return Response({"error": "Профиль не найден"}, status=403)

class AppointmentDetailViewSet(generics.RetrieveUpdateDestroyAPIView):
    """Просмотр, обновление и удаление записи"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Разные права для разных методов"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # Редактировать и удалять могут только админы
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        # Админ видит все
        if user.is_staff:
            return Appointment.objects.all()
        
        # Пациент видит только свои записи
        if getattr(user, 'is_patient', False):
            try:
                patient = Patient.objects.get(user=user)
                return Appointment.objects.filter(patient=patient)
            except Patient.DoesNotExist:
                return Appointment.objects.none()
        
        # Врач видит записи к себе
        if getattr(user, 'is_doctor', False):
            try:
                doctor = Doctor.objects.get(user=user)
                return Appointment.objects.filter(doctor=doctor)
            except Doctor.DoesNotExist:
                return Appointment.objects.none()
        
        return Appointment.objects.none()


class AvailableSlotsView(APIView):
    """
    Получить доступные временные слоты для врача на конкретную дату
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        
        print(f"\n{'='*60}")
        print(f"AvailableSlotsView вызван")
        print(f"doctor_id: {doctor_id}")
        print(f"date: {date_str}")
        print(f"{'='*60}\n")
        
        if not doctor_id or not date_str:
            return Response({
                'success': False,
                'message': 'Не указаны обязательные параметры: doctor_id и date'
            }, status=400)
        
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            print(f"✓ Врач найден: {doctor.first_name} {doctor.last_name}")
        except Doctor.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Врач не найден'
            }, status=404)
        
        target_date = parse_date(date_str)
        
        if not target_date:
            return Response({
                'success': False,
                'message': 'Неверный формат даты'
            }, status=400)
        
        print(f"✓ Дата распознана: {target_date} (день недели: {target_date.weekday()})")
        
        # Проверяем выходной
        if target_date.weekday() in [5, 6]:
            print(f"⚠ Выходной день")
            return Response({
                'success': True, 
                'slots': [],
                'message': 'Выходной день'
            })
        
        # Получаем текущий часовой пояс
        current_tz = timezone.get_current_timezone()
        now = timezone.now()
        
        print(f"✓ Текущее время (UTC): {now}")
        print(f"✓ Текущее время (локальное): {now.astimezone(current_tz)}")
        print(f"✓ Часовой пояс: {current_tz}")
        
        # Генерируем слоты
        slots = []
        start_hour = 9
        end_hour = 18
        lunch_start = 13
        lunch_end = 14
        
        print(f"\n--- Генерация слотов ---")
        
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:
                # Пропускаем обед
                if hour >= lunch_start and hour < lunch_end:
                    continue
                
                # Создаем локальное время для слота
                slot_time = time(hour, minute)
                slot_datetime = timezone.make_aware(
                    datetime.combine(target_date, slot_time),
                    current_tz
                )
                
                # Проверяем что слот не в прошлом
                is_past = slot_datetime <= now
                
                if not is_past:
                    slots.append({
                        'time': f"{hour:02d}:{minute:02d}",
                        'datetime': slot_datetime.isoformat(),
                        'is_past': False
                    })
                    print(f"  ✓ Слот {hour:02d}:{minute:02d} добавлен (datetime={slot_datetime.isoformat()})")
                else:
                    print(f"  ✗ Слот {hour:02d}:{minute:02d} пропущен (в прошлом)")
        
        print(f"\nВсего сгенерировано слотов (не в прошлом): {len(slots)}")
        
        # Получаем занятые слоты
        print(f"\n--- Проверка занятых слотов ---")
        booked = Appointment.objects.filter(
            doctor=doctor,
            date_time__date=target_date,
            status='scheduled'
        )
        
        print(f"Найдено записей на эту дату: {booked.count()}")
        
        booked_times = set()
        for apt in booked:
            # Время в БД (UTC)
            utc_time = apt.date_time
            # Конвертируем в локальное время
            local_time = utc_time.astimezone(current_tz)
            time_str = f"{local_time.hour:02d}:{local_time.minute:02d}"
            booked_times.add(time_str)
            
            print(f"  Запись ID={apt.id}:")
            print(f"    - UTC: {utc_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
            print(f"    - Локальное: {local_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
            print(f"    - Время: {time_str}")
            print(f"    - Пациент: {apt.patient.first_name} {apt.patient.last_name}")
        
        print(f"\nЗанятые времена: {sorted(booked_times)}")
        
        # Помечаем занятые слоты
        available_count = 0
        for slot in slots:
            slot['available'] = slot['time'] not in booked_times
            if slot['available']:
                available_count += 1
        
        print(f"\n--- Итого ---")
        print(f"Всего слотов: {len(slots)}")
        print(f"Доступных: {available_count}")
        print(f"Занятых: {len(booked_times)}")
        print(f"{'='*60}\n")
        
        return Response({
            'success': True,
            'slots': slots,
            'total_slots': len(slots),
            'available_count': available_count,
            'booked_count': len(booked_times),
            'debug': {
                'date': target_date.isoformat(),
                'timezone': str(current_tz),
                'now_utc': now.isoformat(),
                'now_local': now.astimezone(current_tz).isoformat(),
            }
        })

        
class AppointmentDeleteView(APIView):
    """
    Удаление записи (только для администраторов)
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Запись не найдена'}, status=404)
        
        # Проверяем права: только админ или сам пациент может удалить
        if not request.user.is_staff and appointment.patient.user != request.user:
            return Response({
                'error': 'Только администратор может удалять записи'
            }, status=403)
        
        appointment.delete()
        return Response({'success': True, 'message': 'Запись успешно удалена'})


class DoctorAppointmentsView(generics.ListAPIView):
    """Список записей конкретного врача (для пациентов при выборе врача)"""
    serializer_class = AppointmentListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        doctor_id = self.kwargs.get('doctor_id')
        date = self.request.query_params.get('date')
        
        queryset = Appointment.objects.filter(
            doctor_id=doctor_id,
            status='scheduled'
        )
        
        if date:
            try:
                date_obj = datetime.strptime(date, '%Y-%m-%d').date()
                queryset = queryset.filter(date_time__date=date_obj)
            except ValueError:
                pass
        
        return queryset.order_by('date_time')

class DoctorAppointmentsByDateView(APIView):
    """
    Получить записи врача на конкретную дату
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Получаем врача текущего пользователя
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({"error": "Вы не являетесь врачом"}, status=403)
        
        # Получаем дату из параметров запроса
        date_str = request.query_params.get('date')
        
        if date_str:
            # Фильтруем по конкретной дате
            target_date = parse_date(date_str)
            if not target_date:
                return Response({"error": "Неверный формат даты"}, status=400)
            
            appointments = Appointment.objects.filter(
                doctor=doctor,
                date_time__date=target_date
            ).order_by('date_time')
        else:
            # Возвращаем все записи врача
            appointments = Appointment.objects.filter(
                doctor=doctor
            ).order_by('date_time')
        
        # Сериализуем данные
        data = []
        for apt in appointments:
            data.append({
                'id': apt.id,
                'date_time': apt.date_time,
                'status': apt.status,
                'notes': apt.notes,
                'patient': apt.patient.id,
                'patient_details': {
                    'id': apt.patient.id,
                    'first_name': apt.patient.first_name,
                    'last_name': apt.patient.last_name,
                    'phone': apt.patient.phone,
                    'age': apt.patient.age,
                    'avatar': apt.patient.user.avatar.url if hasattr(apt.patient.user, 'avatar') and apt.patient.user.avatar else None,
                }
            })
        
        return Response(data)

# Список лекарств
class MedicineListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        medicines = Medicine.objects.all()
        data = [
            {
                'id': m.id,
                'name': m.name,
                'description': m.description,
                'prescription_required': m.prescription_required
            }
            for m in medicines
        ]
        return Response(data)
    

# 1. Завершение приема с медицинской записью

class CompleteAppointmentView(APIView):
    """
    Завершение приема, создание мед. записи и отправка уведомлений.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, appointment_id):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Только врачи могут завершать прием'}, status=403)
        
        try:
            appointment = Appointment.objects.get(id=appointment_id, doctor=doctor)
        except Appointment.DoesNotExist:
            return Response({'error': 'Запись не найдена'}, status=404)
        
        if appointment.status == 'completed':
            return Response({'error': 'Прием уже завершен'}, status=400)
        
        # --- 1. Получаем данные из запроса ---
        diagnosis = request.data.get('diagnosis')
        complaints = request.data.get('complaints', '')
        anamnesis = request.data.get('anamnesis', '')
        objective_data = request.data.get('objective_data', '')
        recommendations = request.data.get('recommendations', '')
        prescriptions_data = request.data.get('prescriptions', [])
        doctor_notes = request.data.get('doctor_notes', '')
        
        if not diagnosis:
            return Response({'error': 'Диагноз обязателен'}, status=400)
        
        # --- 2. Создаем медицинскую запись и рецепты ---
        medical_record = MedicalRecord.objects.create(
            appointment=appointment,
            complaints=complaints,
            anamnesis=anamnesis,
            objective_data=objective_data,
            diagnosis=diagnosis,
            recommendations=recommendations
        )
        
        for presc in prescriptions_data:
            if presc.get('medicine_id'):
                # Валидация, что такой препарат существует
                if Medicine.objects.filter(id=presc.get('medicine_id')).exists():
                    Prescription.objects.create(
                        medical_record=medical_record,
                        medicine_id=presc.get('medicine_id'),
                        dosage=presc.get('dosage', ''),
                        frequency=presc.get('frequency', ''),
                        duration=presc.get('duration', ''),
                        instructions=presc.get('instructions', '')
                    )
        
        if doctor_notes:
            DoctorNote.objects.create(
                medical_record=medical_record,
                doctor=doctor,
                note=doctor_notes
            )
        
        # --- 3. Обновляем статус приема ---
        appointment.status = 'completed'
        appointment.diagnosis = diagnosis
        appointment.save()
        
        # --- 4. Отправляем уведомления ---
        try:
            # Email с полным отчетом
            send_reception_summary_email(appointment, medical_record)

            # SMS с кратким итогом
            patient_phone = appointment.patient.user.phone # Берем телефон из User
            if patient_phone:
                sms_message = f"Прием у Dr. {appointment.doctor.last_name} ({appointment.date_time.strftime('%d.%m')}) завершен. Диагноз: {diagnosis}. Детали на почте."
                send_sms(patient_phone, sms_message)

        except Exception as e:
            # Логируем ошибку, но не прерываем основной процесс
            print(f"ОШИБКА при отправке уведомлений для записи #{appointment.id}: {e}")

        # --- 5. Возвращаем ответ ---
        return Response({
            'success': True,
            'message': 'Прием завершен',
            'medical_record_id': medical_record.id
        })
# 2. История приемов пациента (медицинская карта)
class PatientMedicalHistoryView(APIView):
    """
    Получение полной истории приемов пациента
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, patient_id):
        # Проверяем права доступа (врач или сам пациент)
        try:
            doctor = Doctor.objects.get(user=request.user)
            is_doctor = True
        except Doctor.DoesNotExist:
            is_doctor = False
        
        if not is_doctor:
            # Если не врач, проверяем что это сам пациент
            try:
                patient = Patient.objects.get(user=request.user)
                if patient.id != int(patient_id):
                    return Response({'error': 'Доступ запрещен'}, status=403)
            except Patient.DoesNotExist:
                return Response({'error': 'Доступ запрещен'}, status=403)
        
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Пациент не найден'}, status=404)
        
        # Получаем все завершенные приемы
        appointments = Appointment.objects.filter(
            patient=patient,
            status='completed'
        ).select_related('doctor', 'medical_record').prefetch_related(
            'medical_record__prescriptions__medicine',
            'medical_record__doctor_notes',
            'medical_record__files'
        ).order_by('-date_time')
        
        history = []
        for apt in appointments:
            record_data = {
                'appointment_id': apt.id,
                'date': apt.date_time.isoformat(),
                'doctor': f"{apt.doctor.last_name} {apt.doctor.first_name}",
                'doctor_specialization': apt.doctor.specialty,
                'diagnosis': apt.diagnosis,
            }
            
            if hasattr(apt, 'medical_record'):
                mr = apt.medical_record
                record_data.update({
                    'medical_record_id': mr.id,
                    'complaints': mr.complaints,
                    'anamnesis': mr.anamnesis,
                    'objective_data': mr.objective_data,
                    'recommendations': mr.recommendations,
                    'prescriptions': [
                        {
                            'id': p.id,
                            'medicine': p.medicine.name,
                            'medicine_id': p.medicine.id,
                            'dosage': p.dosage,
                            'frequency': p.frequency,
                            'duration': p.duration,
                            'instructions': p.instructions
                        }
                        for p in mr.prescriptions.all()
                    ],
                    'files': [
                        {
                            'id': f.id,
                            'title': f.title,
                            'file_type': f.get_file_type_display(),
                            'uploaded_at': f.uploaded_at.isoformat(),
                            'url': f.file.url if f.file else None
                        }
                        for f in mr.files.all()
                    ]
                })
                
                # Приватные заметки видны только врачу
                if is_doctor:
                    record_data['doctor_notes'] = [
                        {
                            'note': note.note,
                            'created_at': note.created_at.isoformat()
                        }
                        for note in mr.doctor_notes.all()
                    ]
            
            history.append(record_data)
        
        return Response({
            'patient': {
                'id': patient.id,
                'name': f"{patient.first_name} {patient.last_name}",
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'birth_date': patient.birth_date,
                'gender': patient.get_gender_display(),
                'height': patient.height,
                'weight': patient.weight,
                'iin': patient.iin,
                'phone': patient.user.phone,
                'chronic_diseases': patient.chronic_diseases,
                'allergies': patient.allergies,
                'blood_type': patient.blood_type,
                'insurance_number': patient.insurance_number,
                'emergency_contact': patient.emergency_contact,
            },
            'history': history
        })


# 3. Шаблоны диагнозов
class DiagnosisTemplateListView(APIView):
    """
    Получение списка шаблонов диагнозов врача
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Только врачи имеют доступ'}, status=403)
        
        templates = DiagnosisTemplate.objects.filter(doctor=doctor)
        
        data = [
            {
                'id': t.id,
                'name': t.name,
                'diagnosis': t.diagnosis,
                'recommendations': t.recommendations,
                'usage_count': t.usage_count
            }
            for t in templates
        ]
        
        return Response(data)
    
    def post(self, request):
        """Создание нового шаблона"""
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Только врачи могут создавать шаблоны'}, status=403)
        
        name = request.data.get('name')
        diagnosis = request.data.get('diagnosis')
        recommendations = request.data.get('recommendations', '')
        
        if not name or not diagnosis:
            return Response({'error': 'Название и диагноз обязательны'}, status=400)
        
        template = DiagnosisTemplate.objects.create(
            doctor=doctor,
            name=name,
            diagnosis=diagnosis,
            recommendations=recommendations
        )
        
        return Response({
            'success': True,
            'template': {
                'id': template.id,
                'name': template.name,
                'diagnosis': template.diagnosis,
                'recommendations': template.recommendations
            }
        })


class UseTemplateView(APIView):
    """
    Использование шаблона (увеличивает счетчик)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, template_id):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Только врачи имеют доступ'}, status=403)
        
        try:
            template = DiagnosisTemplate.objects.get(id=template_id, doctor=doctor)
            template.usage_count += 1
            template.save()
            return Response({'success': True})
        except DiagnosisTemplate.DoesNotExist:
            return Response({'error': 'Шаблон не найден'}, status=404)


# 4. Загрузка файлов пациента
class PatientFileUploadView(APIView):
    """
    Загрузка файлов для пациента (анализы, снимки)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, patient_id):
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Пациент не найден'}, status=404)

        file = request.FILES.get('file')
        file_type = request.data.get('file_type', 'other')
        title = request.data.get('title', 'Документ')
        description = request.data.get('description', '')
        medical_record_id = request.data.get('medical_record_id')

        if not file:
            return Response({'error': 'Файл не предоставлен'}, status=400)

        MAX_SIZE = 5 * 1024 * 1024
        ALLOWED_CONTENT_TYPES = {
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
        }
        if file.size > MAX_SIZE:
            return Response({'error': 'Размер файла превышает 5 МБ'}, status=400)
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            return Response({'error': 'Недопустимый формат файла. Разрешены: pdf, doc, docx, jpg, jpeg, png'}, status=400)

        # ВАЖНО: всегда создаём НОВЫЙ файл (не обновляем существующий)
        pf = PatientFile.objects.create(
            patient=patient,
            medical_record_id=medical_record_id if medical_record_id else None,
            file_type=file_type,
            file=file,
            title=title,
            description=description,
            uploaded_by=request.user
        )

        return Response({
            'success': True,
            'message': 'Файл успешно загружен',
            'file': {
                'id': pf.id,
                'title': pf.title,
                'file_type': pf.get_file_type_display(),
                'uploaded_at': pf.uploaded_at.isoformat(),
                'url': request.build_absolute_uri(pf.file.url) if pf.file else None
            }
        })

# 5. Статистика для врача
class DoctorStatisticsView(APIView):
    """
    Статистика врача (количество приемов, популярные диагнозы)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Только врачи имеют доступ'}, status=403)
        
        # Период (по умолчанию - последние 30 дней)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Общее количество приемов
        total_appointments = Appointment.objects.filter(
            doctor=doctor,
            status='completed',
            date_time__gte=start_date
        ).count()
        
        # Запланированные приемы
        scheduled_appointments = Appointment.objects.filter(
            doctor=doctor,
            status='scheduled'
        ).count()
        
        # Популярные диагнозы
        popular_diagnoses = Appointment.objects.filter(
            doctor=doctor,
            status='completed',
            date_time__gte=start_date,
            diagnosis__isnull=False
        ).exclude(diagnosis='').values('diagnosis').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Уникальные пациенты
        unique_patients = Appointment.objects.filter(
            doctor=doctor,
            status='completed',
            date_time__gte=start_date
        ).values('patient').distinct().count()
        
        # Приемы по дням (последние 7 дней)
        appointments_by_day = []
        for i in range(7):
            day = timezone.now().date() - timedelta(days=i)
            count = Appointment.objects.filter(
                doctor=doctor,
                status='completed',
                date_time__date=day
            ).count()
            appointments_by_day.append({
                'date': day.isoformat(),
                'count': count
            })
        
        return Response({
            'period_days': days,
            'total_completed': total_appointments,
            'scheduled': scheduled_appointments,
            'unique_patients': unique_patients,
            'popular_diagnoses': list(popular_diagnoses),
            'appointments_by_day': list(reversed(appointments_by_day))
        })


# 6. Список лекарств (с учетом противопоказаний)
class MedicineListView(APIView):
    """
    Список лекарств с информацией о противопоказаниях
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        patient_id = request.query_params.get('patient_id')
        
        medicines = Medicine.objects.all()
        data = []
        
        for m in medicines:
            medicine_data = {
                'id': m.id,
                'name': m.name,
                'description': m.description,
                'prescription_required': m.prescription_required,
                'side_effects': m.side_effects,
                'contraindications': m.contraindications,
            }
            
            # Проверка на аллергии пациента
            if patient_id:
                try:
                    patient = Patient.objects.get(id=patient_id)
                    if patient.allergies:
                        # Простая проверка - если название лекарства содержится в аллергиях
                        if m.name.lower() in patient.allergies.lower():
                            medicine_data['warning'] = f'⚠️ ВНИМАНИЕ! У пациента аллергия!'
                            medicine_data['has_allergy'] = True
                except Patient.DoesNotExist:
                    pass
            
            data.append(medicine_data)
        
        return Response(data)

# 1. СИНХРОНИЗАЦИЯ АКТИВНЫХ ПРЕПАРАТОВ
class PatientActiveMedicinesSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Доступ только для врача'}, status=status.HTTP_403_FORBIDDEN)

        patient_id = request.data.get('patient_id')
        active = request.data.get('active')
        meds = request.data.get('medicines', [])

        if patient_id is None or active is None:
            return Response({'error': 'patient_id и active обязательны'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Пациент не найден'}, status=status.HTTP_404_NOT_FOUND)

        PatientActiveMedicine.objects.filter(patient=patient, doctor=doctor).delete()

        if bool(active):
            bulk = []
            for m in meds:
                mid = m.get('medicine_id')
                if not mid: continue
                if not Medicine.objects.filter(id=mid).exists(): continue
                bulk.append(PatientActiveMedicine(
                    patient=patient, doctor=doctor, medicine_id=mid,
                    dosage=m.get('dosage', ''), frequency=m.get('frequency', ''),
                    duration=m.get('duration', ''), instructions=m.get('instructions', '')
                ))
            if bulk:
                PatientActiveMedicine.objects.bulk_create(bulk)

        return Response({'success': True})

# 2. ПОЛУЧЕНИЕ СПИСКА АКТИВНЫХ ПРЕПАРАТОВ ДЛЯ ПАЦИЕНТА
class PatientActiveMedicinesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response({'error': 'Вы не являетесь пациентом'}, status=status.HTTP_403_FORBIDDEN)
        
        active_medicines = PatientActiveMedicine.objects.filter(
            patient=patient
        ).select_related('medicine', 'doctor')
        
        data = []
        for am in active_medicines:
            data.append({
                'medicine_id': am.medicine.id,
                'medicine_name': am.medicine.name,
                'description': am.medicine.description,
                'side_effects': am.medicine.side_effects,
                'contraindications': am.medicine.contraindications,
                'prescription_required': am.medicine.prescription_required,
                'dosage': am.dosage,
                'frequency': am.frequency,
                'duration': am.duration,
                'instructions': am.instructions,
                'prescribed_by': f"Dr. {am.doctor.last_name} {am.doctor.first_name}",
                'created_at': am.created_at.isoformat(),
            })
            
        return Response(data)

# 3. СОЗДАНИЕ ПОВТОРНОЙ ЗАПИСИ ВРАЧОМ
class AppointmentCreateByDoctorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'success': False, 'message': 'Только врач может создавать запись'}, status=status.HTTP_403_FORBIDDEN)

        patient_id = request.data.get('patient_id')
        date_time_str = request.data.get('date_time')
        notes = request.data.get('notes', '')

        if not patient_id or not date_time_str:
            return Response({'success': False, 'message': 'patient_id и date_time обязательны'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'success': False, 'message': 'Пациент не найден'}, status=status.HTTP_404_NOT_FOUND)

        dt = parse_datetime(date_time_str)
        if not dt:
            return Response({'success': False, 'message': 'Неверный формат даты'}, status=status.HTTP_400_BAD_REQUEST)
        
        if timezone.is_naive(dt):
            current_tz = timezone.get_current_timezone()
            dt = timezone.make_aware(dt, current_tz)

        if dt.weekday() in [5, 6]:
            return Response({'success': False, 'message': 'Запись на выходные дни запрещена'}, status=status.HTTP_400_BAD_REQUEST)

        local_time = dt.astimezone(timezone.get_current_timezone()).time()
        if not (time(9, 0) <= local_time < time(18, 0) and not (time(13, 0) <= local_time < time(14, 0))):
            return Response({'success': False, 'message': 'Запись возможна только в рабочее время'}, status=status.HTTP_400_BAD_REQUEST)

        if Appointment.objects.filter(doctor=doctor, date_time=dt, status='scheduled').exists():
            return Response({'success': False, 'message': 'У врача уже есть запись в это время'}, status=status.HTTP_400_BAD_REQUEST)

        if Appointment.objects.filter(patient=patient, date_time=dt, status='scheduled').exists():
            return Response({'success': False, 'message': 'У пациента уже есть запись в это время'}, status=status.HTTP_400_BAD_REQUEST)

        appointment = Appointment.objects.create(
            patient=patient, doctor=doctor, date_time=dt, notes=notes,
            status='scheduled',
            room_number=doctor.office_number if hasattr(doctor, 'office_number') else None
        )

        return Response({'success': True, 'message': 'Повторная запись создана', 'appointment': {'id': appointment.id}})
