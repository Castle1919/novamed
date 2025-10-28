from django.contrib import admin
from django.urls import path, include, re_path
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
    re_path(r'^api/patients/(?P<pk>[0-9]+)/$', patient_views.PatientDetailView.as_view(), name='patients_detail'),
    path('api/patients/me/', patient_views.MyPatientView.as_view(), name='my_patient'),
    path('api/patients/check_unique/', patient_views.PatientUniqueCheckView.as_view(), name='patient_check_unique'),
    re_path(r'^api/patients/(?P<patient_id>[0-9]+)/history/$', patient_views.PatientMedicalHistoryView.as_view(), name='patient_history'),
    re_path(r'^api/patients/(?P<patient_id>[0-9]+)/files/upload/$', patient_views.PatientFileUploadView.as_view(), name='upload_file'),
    path('api/patients/active-medicines/', patient_views.PatientActiveMedicinesListView.as_view(), name='patient_active_medicines'),
    path('api/patients/active-medicines/sync/', patient_views.PatientActiveMedicinesSyncView.as_view(), name='active_medicines_sync'),
    
    # ===== Doctors =====
    path('api/doctors/', patient_views.DoctorListView.as_view(), name='doctors_list'),
    re_path(r'^api/doctors/(?P<pk>[0-9]+)/$', patient_views.DoctorDetailView.as_view(), name='doctors_detail'),
    path('api/doctors/me/', patient_views.MyDoctorView.as_view(), name='my_doctor'),
    re_path(r'^api/doctors/(?P<doctor_id>[0-9]+)/appointments/$', patient_views.DoctorAppointmentsView.as_view(), name='doctor_appointments'),
    path('api/doctors/statistics/', patient_views.DoctorStatisticsView.as_view(), name='doctor_statistics'),
    
    # ===== Medicines =====
    path('api/medicines/', patient_views.MedicineListView.as_view(), name='medicines_list'),
    re_path(r'^api/medicines/(?P<pk>[0-9]+)/$', patient_views.MedicineDetailView.as_view(), name='medicines_detail'),
    
    # ===== Appointments =====
    path('api/appointments/', patient_views.MyAppointmentsView.as_view(), name='my_appointments'),
    path('api/appointments/create/', patient_views.AppointmentCreateView.as_view(), name='appointment_create'),
    path('api/appointments/available-slots/', patient_views.AvailableSlotsView.as_view(), name='available_slots'),
    path('api/appointments/create-by-doctor/', patient_views.AppointmentCreateByDoctorView.as_view(), name='appointment_create_by_doctor'),
    re_path(r'^api/appointments/(?P<pk>[0-9]+)/$', patient_views.AppointmentDetailViewSet.as_view(), name='appointment_detail'),
    re_path(r'^api/appointments/(?P<appointment_id>[0-9]+)/complete/$', patient_views.CompleteAppointmentView.as_view(), name='complete_appointment'),
    
    # ===== Diagnosis Templates =====
    path('api/diagnosis-templates/', patient_views.DiagnosisTemplateListView.as_view(), name='diagnosis_templates'),
    re_path(r'^api/diagnosis-templates/(?P<template_id>[0-9]+)/use/$', patient_views.UseTemplateView.as_view(), name='use_template'),   
]