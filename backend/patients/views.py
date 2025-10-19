from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Patient, Doctor, Medicine, Appointment
from .serializers import (
    PatientSerializer,
    DoctorSerializer,
    MedicineSerializer,
    AppointmentSerializer
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

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
            raise NotFound("Пациент не найден для текущего пользователя")


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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DoctorDetailView(generics.RetrieveAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]


class MyDoctorView(generics.RetrieveUpdateAPIView):
    """
    Получить или обновить профиль текущего врача.
    Если профиль отсутствует — вернуть 404 (без создания автоматически).
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if not getattr(user, 'is_doctor', False):
            raise PermissionDenied("Текущий пользователь не является врачом.")
        try:
            return Doctor.objects.get(user=user)
        except Doctor.DoesNotExist:
            raise NotFound("Профиль врача не найден. Создайте его вручную.")

    def get(self, request, *args, **kwargs):
        doctor = self.get_object()
        serializer = self.get_serializer(doctor)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        doctor = self.get_object()
        serializer = self.get_serializer(doctor, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        doctor = self.get_object()
        serializer = self.get_serializer(doctor, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


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


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def doctor_profile_view(request):
    """
    Получение и обновление профиля доктора (по текущему пользователю)
    """
    try:
        doctor = Doctor.objects.get(user=request.user)
    except Doctor.DoesNotExist:
        return Response({"detail": "Доктор не найден"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = DoctorSerializer(doctor)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = DoctorSerializer(doctor, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
