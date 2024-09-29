from django.urls import path
from .views import RegisterView, UserView, check_email_exists

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenVerifyView,
    TokenRefreshView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register_user'),
    path('email/', check_email_exists, name='check_email_exists'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('user/', UserView.as_view(), name='user_info'),
]
