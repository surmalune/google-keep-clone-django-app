from django.urls import path, include

urlpatterns = [
    path('', include('notes.api.urls'))
]
