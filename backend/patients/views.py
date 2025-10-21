from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
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
    )
from .serializers import (
    PatientSerializer,
    DoctorSerializer,
    MedicineSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentListSerializer,
    AppointmentDetailSerializer,
    AvailableSlotsSerializer,
)
from django.utils import timezone
from datetime import datetime, timedelta, time, date
from django.utils.dateparse import parse_date
from django.utils.dateparse import parse_datetime
from django.db.models import Count, Q



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


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsDoctorUser]


class MyPatientView(generics.RetrieveUpdateAPIView):
    """Получить или обновить профиль текущего пациента"""
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return Patient.objects.get(user=self.request.user)
        except Patient.DoesNotExist:
            raise NotFound("Профиль пациента не найден для текущего пользователя")


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



class DoctorDetailView(generics.RetrieveAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]


class MyDoctorView(generics.RetrieveUpdateAPIView):
    """
    Получить или обновить профиль текущего врача.
    GET - получить профиль
    PUT/PATCH - обновить профиль
    POST (через perform_create) - создать профиль, если его нет
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

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

    def get(self, request, *args, **kwargs):
        """GET запрос - получить профиль врача"""
        try:
            doctor = self.get_object()
            serializer = self.get_serializer(doctor)
            return Response(serializer.data)
        except NotFound as e:
            return Response(
                {"detail": str(e)}, 
                status=status.HTTP_404_NOT_FOUND
            )

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

    def patch(self, request, *args, **kwargs):
        """PATCH запрос - частичное обновление или создание"""
        user = request.user
        
        if not getattr(user, 'is_doctor', False):
            return Response(
                {"detail": "Текущий пользователь не является врачом"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            doctor = Doctor.objects.get(user=user)
            serializer = self.get_serializer(doctor, data=request.data, partial=True)
        except Doctor.DoesNotExist:
            # При частичном обновлении, если профиля нет - создаем с переданными данными
            serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        doctor = serializer.save(user=user)
        
        return Response(serializer.data, status=status.HTTP_200_OK)


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
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        date_str = request.query_params.get('date')
        
        # Проверяем, является ли пользователь врачом
        try:
            doctor = Doctor.objects.get(user=request.user)
            # Если врач, возвращаем его записи
            if date_str:
                from django.utils.dateparse import parse_date
                target_date = parse_date(date_str)
                if target_date:
                    appointments = Appointment.objects.filter(
                        doctor=doctor,
                        date_time__date=target_date
                    ).select_related('patient', 'patient__user').order_by('date_time')
                else:
                    appointments = Appointment.objects.filter(
                        doctor=doctor
                    ).select_related('patient', 'patient__user').order_by('date_time')
            else:
                appointments = Appointment.objects.filter(
                    doctor=doctor
                ).select_related('patient', 'patient__user').order_by('date_time')
            
            # Сериализуем данные для врача
            data = []
            for apt in appointments:
                # Вычисляем возраст из birth_date
                age = None
                if apt.patient.birth_date:
                    today = date.today()
                    born = apt.patient.birth_date
                    age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
                
                patient_data = {
                    'id': apt.patient.id,
                    'first_name': apt.patient.first_name,
                    'last_name': apt.patient.last_name,
                    'phone': apt.patient.phone or '',
                    'age': age,
                    'gender': apt.patient.get_gender_display() if apt.patient.gender else '',
                    'iin': apt.patient.iin,
                }
                
                # Добавляем аватар если есть
                if hasattr(apt.patient.user, 'avatar') and apt.patient.user.avatar:
                    patient_data['avatar'] = request.build_absolute_uri(apt.patient.user.avatar.url)
                    
                data.append({
                    'id': apt.id,
                    'date_time': apt.date_time.isoformat(),
                    'status': apt.status,
                    'notes': apt.notes or '',
                    'diagnosis': apt.diagnosis or '',
                    'room_number': apt.room_number or '',
                    'patient': apt.patient.id,
                    'patient_details': patient_data
                })
            return Response(data)
            
        except Doctor.DoesNotExist:
            pass
        
        # Если не врач, проверяем пациента
        try:
            patient = Patient.objects.get(user=request.user)
            appointments = Appointment.objects.filter(
                patient=patient
            ).select_related('doctor').order_by('-date_time')
            
            # Сериализуем данные для пациента
            data = []
            for apt in appointments:
                data.append({
                    'id': apt.id,
                    'date_time': apt.date_time.isoformat(),
                    'status': apt.status,
                    'notes': apt.notes or '',
                    'diagnosis': apt.diagnosis or '',
                    'room_number': apt.room_number or '',
                    'doctor': apt.doctor.id,
                    'doctor_details': {
                        'id': apt.doctor.id,
                        'name': f"{apt.doctor.last_name} {apt.doctor.first_name}",
                        'specialization': apt.doctor.specialty,
                        'office_number': apt.room_number or getattr(apt.doctor, 'office_number', ''),  # ДОБАВЛЕНО
                        'phone': apt.doctor.work_phone or '',
                        'experience_years': apt.doctor.experience_years,
                    }
                })
            return Response(data)
            
        except Patient.DoesNotExist:
            return Response({"error": "Пользователь не является ни врачом, ни пациентом"}, status=403)


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
        
        if not doctor_id or not date_str:
            return Response({
                'success': False,
                'message': 'Не указаны обязательные параметры: doctor_id и date'
            }, status=400)
        
        try:
            doctor = Doctor.objects.get(id=doctor_id)
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
        
        # Проверяем выходной
        if target_date.weekday() in [5, 6]:
            return Response({'success': True, 'slots': []})
        
        # Получаем текущий часовой пояс из настроек Django
        current_tz = timezone.get_current_timezone()
        
        # Генерируем все временные слоты с timezone-aware datetime
        all_slots = []
        current_time = timezone.make_aware(
            datetime.combine(target_date, datetime.min.time().replace(hour=9, minute=0)),
            current_tz
        )
        end_time = timezone.make_aware(
            datetime.combine(target_date, datetime.min.time().replace(hour=18, minute=0)),
            current_tz
        )
        lunch_start = timezone.make_aware(
            datetime.combine(target_date, datetime.min.time().replace(hour=13, minute=0)),
            current_tz
        )
        lunch_end = timezone.make_aware(
            datetime.combine(target_date, datetime.min.time().replace(hour=14, minute=0)),
            current_tz
        )
        
        while current_time < end_time:
            if not (lunch_start <= current_time < lunch_end):
                all_slots.append(current_time)
            current_time += timedelta(minutes=30)
        
        # Получаем занятые слоты (в БД они в UTC)
        booked_appointments = Appointment.objects.filter(
            doctor=doctor,
            date_time__date=target_date,  # Django автоматически конвертирует дату
            status='scheduled'
        )
        
        booked_datetimes = []
        for apt in booked_appointments:
            # Конвертируем UTC время в локальное
            local_time = apt.date_time.astimezone(current_tz)
            booked_datetimes.append(local_time)
            print(f"  - Appointment ID {apt.id}: UTC={apt.date_time.strftime('%H:%M')}, Local={local_time.strftime('%H:%M')}")
        
        
        # Формируем ответ
        slots = []
        for slot_datetime in all_slots:
            slot_time_str = slot_datetime.strftime('%H:%M')
            
            # Проверяем занят ли слот (сравниваем timezone-aware datetime)
            is_available = True
            for booked_dt in booked_datetimes:
                # Сравниваем час и минуту
                if (slot_datetime.hour == booked_dt.hour and 
                    slot_datetime.minute == booked_dt.minute):
                    is_available = False
                    print(f"DEBUG: Slot {slot_time_str} is BOOKED")
                    break
            
            slots.append({
                'time': slot_time_str,
                'datetime': slot_datetime.isoformat(),
                'available': is_available
            })
        
        available_count = sum(1 for s in slots if s['available'])
        print(f"Total slots: {len(slots)}, Available: {available_count}, Booked: {len(slots) - available_count}\n")
        
        return Response({
            'success': True,
            'slots': slots
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
    
# Завершение приема
class CompleteAppointmentView(APIView):
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
        
        # Данные из формы
        diagnosis = request.data.get('diagnosis')
        complaints = request.data.get('complaints', '')
        anamnesis = request.data.get('anamnesis', '')
        objective_data = request.data.get('objective_data', '')
        recommendations = request.data.get('recommendations', '')
        prescriptions_data = request.data.get('prescriptions', [])
        
        if not diagnosis:
            return Response({'error': 'Диагноз обязателен'}, status=400)
        
        # Создаем медицинскую запись
        medical_record = MedicalRecord.objects.create(
            appointment=appointment,
            complaints=complaints,
            anamnesis=anamnesis,
            objective_data=objective_data,
            diagnosis=diagnosis,
            recommendations=recommendations
        )
        
        # Создаем рецепты
        for presc in prescriptions_data:
            mid = presc.get('medicine_id')
            if not mid:
                continue
            try:
                mid = int(mid)
            except (TypeError, ValueError):
                return Response({'error': f'Некорректный препарат (id={mid})'}, status=400)

            if not Medicine.objects.filter(id=mid).exists():
                return Response({'error': f'Препарат c id={mid} не найден'}, status=400)

            Prescription.objects.create(
                medical_record=medical_record,
                medicine_id=mid,
                dosage=presc.get('dosage', ''),
                frequency=presc.get('frequency', ''),
                duration=presc.get('duration', ''),
                instructions=presc.get('instructions', '')
            )
            
        # Обновляем статус записи
        appointment.status = 'completed'
        appointment.diagnosis = diagnosis
        appointment.save()
        
        return Response({
            'success': True,
            'message': 'Прием завершен',
            'medical_record_id': medical_record.id
        })


# Получение истории приемов пациента
class PatientMedicalHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, patient_id):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Только врачи имеют доступ'}, status=403)
        
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Пациент не найден'}, status=404)
        
        # Получаем все завершенные приемы
        appointments = Appointment.objects.filter(
            patient=patient,
            status='completed'
        ).select_related('doctor', 'medical_record').order_by('-date_time')
        
        history = []
        for apt in appointments:
            record_data = {
                'appointment_id': apt.id,
                'date': apt.date_time.isoformat(),
                'doctor': f"{apt.doctor.last_name} {apt.doctor.first_name}",
                'diagnosis': apt.diagnosis,
            }
            
            if hasattr(apt, 'medical_record'):
                mr = apt.medical_record
                record_data.update({
                    'complaints': mr.complaints,
                    'anamnesis': mr.anamnesis,
                    'recommendations': mr.recommendations,
                    'prescriptions': [
                        {
                            'medicine': p.medicine.name,
                            'dosage': p.dosage,
                            'frequency': p.frequency,
                            'duration': p.duration
                        }
                        for p in mr.prescriptions.all()
                    ]
                })
            
            history.append(record_data)
        
        return Response({
            'patient': {
                'id': patient.id,
                'name': f"{patient.first_name} {patient.last_name}",
                'birth_date': patient.birth_date,
                'gender': patient.get_gender_display(),
                'chronic_diseases': patient.chronic_diseases,
                'allergies': patient.allergies,
                'blood_type': patient.blood_type,
            },
            'history': history
        })


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
    Завершение приема и создание медицинской записи
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
        
        # Данные из формы
        diagnosis = request.data.get('diagnosis')
        complaints = request.data.get('complaints', '')
        anamnesis = request.data.get('anamnesis', '')
        objective_data = request.data.get('objective_data', '')
        recommendations = request.data.get('recommendations', '')
        prescriptions_data = request.data.get('prescriptions', [])
        doctor_notes = request.data.get('doctor_notes', '')
        
        if not diagnosis:
            return Response({'error': 'Диагноз обязателен'}, status=400)
        
        # Создаем медицинскую запись
        medical_record = MedicalRecord.objects.create(
            appointment=appointment,
            complaints=complaints,
            anamnesis=anamnesis,
            objective_data=objective_data,
            diagnosis=diagnosis,
            recommendations=recommendations
        )
        
        # Создаем рецепты
        for presc in prescriptions_data:
            if presc.get('medicine_id'):
                Prescription.objects.create(
                    medical_record=medical_record,
                    medicine_id=presc.get('medicine_id'),
                    dosage=presc.get('dosage', ''),
                    frequency=presc.get('frequency', ''),
                    duration=presc.get('duration', ''),
                    instructions=presc.get('instructions', '')
                )
        
        # Создаем приватную заметку врача (если есть)
        if doctor_notes:
            DoctorNote.objects.create(
                medical_record=medical_record,
                doctor=doctor,
                note=doctor_notes
            )
        
        # Обновляем статус записи
        appointment.status = 'completed'
        appointment.diagnosis = diagnosis
        appointment.save()
        
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
                'birth_date': patient.birth_date.isoformat() if patient.birth_date else None,
                'gender': patient.get_gender_display(),
                'chronic_diseases': patient.chronic_diseases,
                'allergies': patient.allergies,
                'blood_type': patient.blood_type,
                'phone': patient.phone,
                'iin': patient.iin,
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


class AppointmentCreateByDoctorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'success': False, 'message': 'Только врач может создавать запись'}, status=403)

        patient_id = request.data.get('patient_id')
        date_time_str = request.data.get('date_time')
        notes = request.data.get('notes', '')

        if not patient_id or not date_time_str:
            return Response({'success': False, 'message': 'patient_id и date_time обязательны'}, status=400)

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'success': False, 'message': 'Пациент не найден'}, status=404)

        dt = parse_datetime(date_time_str)
        if not dt:
            return Response({'success': False, 'message': 'Неверный формат даты'}, status=400)
        
        if timezone.is_naive(dt):
            current_tz = timezone.get_current_timezone()
            dt = timezone.make_aware(dt, current_tz)

        # 1. Проверка на выходной/праздничный день
        if dt.weekday() in [5, 6]:
            return Response({'success': False, 'message': 'Запись на выходные дни запрещена'}, status=400)

        # 2. Проверка на рабочее время (с 9:00 до 18:00) и обед (13:00-14:00)
        local_time = dt.astimezone(timezone.get_current_timezone()).time()
        if not (time(9, 0) <= local_time < time(18, 0) and not (time(13, 0) <= local_time < time(14, 0))):
            return Response({'success': False, 'message': 'Запись возможна только в рабочее время (с 9:00 до 18:00, кроме обеда)'}, status=400)

        # 3. Проверка: врач занят
        if Appointment.objects.filter(doctor=doctor, date_time=dt, status='scheduled').exists():
            return Response({'success': False, 'message': 'У врача уже есть запись в это время'}, status=400)

        # 4. Проверка: пациент занят
        if Appointment.objects.filter(patient=patient, date_time=dt, status='scheduled').exists():
            return Response({'success': False, 'message': 'У пациента уже есть запись в это время'}, status=400)

        # Создаём запись
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            date_time=dt,
            notes=notes,
            status='scheduled',
            room_number=doctor.office_number if hasattr(doctor, 'office_number') else None
        )

        return Response({
            'success': True,
            'message': 'Повторная запись создана',
            'appointment': { 'id': appointment.id }
        })