from django.contrib import admin
from .models import Patient, Doctor, Appointment, Medicine

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'blood_type', 'insurance_number', 'emergency_contact')
    search_fields = ('user__email', 'user__username')

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'department', 'working_hours')
    search_fields = ('user__email', 'user__username', 'department')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'status', 'room_number')
    list_filter = ('status',)
    search_fields = ('patient__user__email', 'doctor__user__email')

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name',)
