from django.contrib import admin
from django.urls import path
from patients import views as patient_views
from accounts.views import MyTokenObtainPairView, UserDetailView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # ===== JWT Auth =====
    path('api/accounts/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/accounts/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Профиль текущего пользователя
    path('api/accounts/profile/', UserDetailView.as_view(), name='user-profile'),

    # ===== Patients =====
    path('api/patients/', patient_views.PatientListView.as_view(), name='patients_list'),
    path('api/patients/<int:pk>/', patient_views.PatientDetailView.as_view(), name='patients_detail'),
    path('api/patients/me/', patient_views.MyPatientView.as_view(), name='my_patient'),
    path('api/patients/check_unique/', patient_views.PatientUniqueCheckView.as_view(), name='patient_check_unique'),

    # ===== Doctors =====
    path('api/doctors/', patient_views.DoctorListView.as_view(), name='doctors_list'),
    path('api/doctors/<int:pk>/', patient_views.DoctorDetailView.as_view(), name='doctors_detail'),
    path('api/doctors/my/', patient_views.MyDoctorView.as_view(), name='my_doctor'),
    path('api/doctors/me/', patient_views.doctor_profile_view, name='doctor-profile'),
    

    # ===== Medicines =====
    path('api/medicines/', patient_views.MedicineListView.as_view(), name='medicines_list'),
    path('api/medicines/<int:pk>/', patient_views.MedicineDetailView.as_view(), name='medicines_detail'),

    # ===== Appointments =====
    path('api/appointments/', patient_views.AppointmentListView.as_view(), name='appointments_list'),
    path('api/appointments/<int:pk>/', patient_views.AppointmentDetailView.as_view(), name='appointments_detail'),
]
