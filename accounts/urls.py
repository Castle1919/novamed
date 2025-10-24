from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('activate/<slug:uidb64>/<slug:token>/', ActivateUserView.as_view(), name='activate'),
    
]
