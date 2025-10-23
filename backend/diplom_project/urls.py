from django.contrib import admin
from django.urls import path, include
from patients import views as patient_views
from accounts.views import MyTokenObtainPairView, UserDetailView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # ===== JWT Auth =====
    path('api/accounts/', include('accounts.urls')), 
    path('api/accounts/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/accounts/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/profile/', UserDetailView.as_view(), name='user-profile'),

    # ===== Patients =====
    path('api/patients/', patient_views.PatientListView.as_view(), name='patients_list'),
    path('api/patients/<int:pk>/', patient_views.PatientDetailView.as_view(), name='patients_detail'),
    path('api/patients/me/', patient_views.MyPatientView.as_view(), name='my_patient'),
    path('api/patients/check_unique/', patient_views.PatientUniqueCheckView.as_view(), name='patient_check_unique'),
    path('api/patients/<int:patient_id>/history/', patient_views.PatientMedicalHistoryView.as_view(), name='patient_history'),
    path('api/patients/<int:patient_id>/files/upload/', patient_views.PatientFileUploadView.as_view(), name='upload_file'),
    path('api/patients/active-medicines/', patient_views.PatientActiveMedicinesListView.as_view(), name='patient_active_medicines'),
    path('api/patients/active-medicines/sync/', patient_views.PatientActiveMedicinesSyncView.as_view(), name='active_medicines_sync'),
    # ===== Doctors =====
    path('api/doctors/', patient_views.DoctorListView.as_view(), name='doctors_list'),
    path('api/doctors/<int:pk>/', patient_views.DoctorDetailView.as_view(), name='doctors_detail'),
    path('api/doctors/me/', patient_views.MyDoctorView.as_view(), name='my_doctor'),
    path('api/doctors/my/', patient_views.MyDoctorView.as_view(), name='my_doctor_alt'),
    path('api/doctors/<int:doctor_id>/appointments/', patient_views.DoctorAppointmentsView.as_view(), name='doctor_appointments'),
    path('api/doctors/statistics/', patient_views.DoctorStatisticsView.as_view(), name='doctor_statistics'),
    


    # ===== Medicines =====
    path('api/medicines/', patient_views.MedicineListView.as_view(), name='medicines_list'),
    path('api/medicines/<int:pk>/', patient_views.MedicineDetailView.as_view(), name='medicines_detail'),
    path('api/medicines/list/', patient_views.MedicineListView.as_view(), name='medicines_list_all'),
    


    # ===== Appointments =====
    path('api/appointments/', patient_views.MyAppointmentsView.as_view(), name='my_appointments'),
    path('api/appointments/create/', patient_views.AppointmentCreateView.as_view(), name='appointment_create'),
    path('api/appointments/<int:pk>/', patient_views.AppointmentDetailViewSet.as_view(), name='appointment_detail'),
    path('api/appointments/available-slots/', patient_views.AvailableSlotsView.as_view(), name='available_slots'),
    path('api/appointments/doctor/', patient_views.DoctorAppointmentsByDateView.as_view(), name='doctor_appointments_by_date'),
    path('api/appointments/<int:pk>/', patient_views.AppointmentDeleteView.as_view(), name='appointment_delete'),
    path('api/appointments/<int:appointment_id>/complete/', patient_views.CompleteAppointmentView.as_view(), name='complete_appointment'),
    path('api/patients/<int:patient_id>/history/', patient_views.PatientMedicalHistoryView.as_view(), name='patient_history'),
    path('api/appointments/<int:appointment_id>/complete/', patient_views.CompleteAppointmentView.as_view(), name='complete_appointment'),
    path('api/appointments/create-by-doctor/', patient_views.AppointmentCreateByDoctorView.as_view(), name='appointment_create_by_doctor'),
    
    # ===== Dagnosis =====
    path('api/diagnosis-templates/', patient_views.DiagnosisTemplateListView.as_view(), name='diagnosis_templates'),
    path('api/diagnosis-templates/<int:template_id>/use/', patient_views.UseTemplateView.as_view(), name='use_template'),
    
    
]