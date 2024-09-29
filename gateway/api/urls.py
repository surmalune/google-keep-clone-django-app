from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^api/account/(?P<path>.*)$', views.proxy_to_account_service),
    re_path(r'^api/notes/(?P<path>.*)$', views.proxy_to_notes_service),
]
