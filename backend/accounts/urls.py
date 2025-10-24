from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('activate/<slug:uidb64>/<slug:token>/', ActivateUserView.as_view(), name='activate'),
    path('phone/send-verification/', SendPhoneVerificationCodeView.as_view(), name='phone-send-verification'),
    path('phone/verify/', VerifyPhoneView.as_view(), name='phone-verify'),
    path('profile/update-phone/', UpdatePhoneView.as_view(), name='update-phone'),

]
