from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from .views.listitem_views import ListItemDetailApi
from .views.note_views import NoteDetailApi, NoteImageDestroyApi, NoteApi

notes_urlpatterns = [
    path('', NoteApi.as_view(), name='note-list-create'),
    path('<int:note_id>/image/', NoteImageDestroyApi.as_view(), name='note-image-delete'),
    path('<int:pk>/', NoteDetailApi.as_view(), name='note-detail'),
]

urlpatterns = [
    path('notes/', include(notes_urlpatterns)),
    path('list-items/<int:pk>/', ListItemDetailApi.as_view(), name='list-items')
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
