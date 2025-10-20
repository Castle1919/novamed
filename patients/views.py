from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import Patient, Doctor, Medicine, Appointment
from .serializers import (
    PatientSerializer,
    DoctorSerializer,
    MedicineSerializer,
    AppointmentSerializer
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
class DoctorListView(generics.ListCreateAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Любой аутентифицированный пользователь может видеть список врачей.
        """
        return Doctor.objects.all()

    def perform_create(self, serializer):
        """
        Только врач может создать профиль.
        """
        user = self.request.user
        if not getattr(user, 'is_doctor', False):
            raise PermissionDenied("Только врач может создавать профиль врача")
        serializer.save(user=user)



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