import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.exceptions import NotFound
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.filters import SearchFilter

from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from notes.services.note_services import NoteService
from notes.models import Note
from notes.permissions import IsNoteOwner, IsAuthenticated
from notes.api.serializers.note_serializers import NoteUpdateSerializer, NoteReadSerializer, NoteCreateSerializer
from notes.api.filters import NoteFilterSet


logger = logging.getLogger('notes')


class NoteApi(GenericAPIView):
    http_method_names = ['get', 'post']
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser]

    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['title', 'content']
    filterset_class = NoteFilterSet

    queryset = Note.objects.prefetch_related('list_items')

    def get_serializer_class(self):
        return NoteCreateSerializer if self.request.method == 'POST' else NoteReadSerializer

    def get(self, request: Request, *args, **kwargs) -> Response:
        user_id = _get_userid_from_request(request)
        logger.info("Fetching notes for user_id=%s", user_id)

        notes = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(notes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request: Request, *args, **kwargs) -> Response:
        user_id = _get_userid_from_request(request)
        logger.info("Creating note for user_id=%s", user_id)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note = NoteService.create(serializer.validated_data, user_id)
        logger.info("Note successfully created for user_id=%s", user_id)

        response_serializer = NoteReadSerializer(note)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class NoteDetailApi(GenericAPIView):
    http_method_names = ['get', 'patch', 'delete']
    permission_classes = [IsAuthenticated, IsNoteOwner]
    parser_classes = [MultiPartParser, JSONParser]
    queryset = Note.objects.prefetch_related('list_items')

    def get_serializer_class(self):
        return NoteUpdateSerializer if self.request.method in ['PUT', 'PATCH'] else NoteReadSerializer

    def get(self, request: Request, *args, **kwargs) -> Response:
        user_id = _get_userid_from_request(request)
        logger.info(
            "Fetching note details for note_id=%s by user_id=%s", kwargs['pk'], user_id)

        note = self.get_object()
        serializer = self.get_serializer(note)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request: Request, *args, **kwargs) -> Response:
        user_id = _get_userid_from_request(request)
        logger.info(
            "Partially updating note_id=%s by user_id=%s", kwargs['pk'], user_id)

        note = self.get_object()
        serializer = self.get_serializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        note = NoteService.update(note, serializer.validated_data)
        logger.info("Note successfully updated for user_id=%s", user_id)

        response_serializer = NoteReadSerializer(note)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request: Request, *args, **kwargs) -> Response:
        user_id = _get_userid_from_request(request)
        logger.warning(
            "Deleting note_id=%s by user_id=%s", kwargs['pk'], user_id)

        note = self.get_object()
        NoteService.delete(note)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NoteImageDestroyApi(APIView):
    http_method_names = ['delete']
    permission_classes = [IsAuthenticated, IsNoteOwner]

    def get_object(self):
        note = get_object_or_404(Note, pk=self.kwargs['note_id'])
        self.check_object_permissions(self.request, note)
        return note

    def delete(self, request: Request, note_id, *args, **kwargs) -> Response:
        user_id = _get_userid_from_request(request)
        logger.warning(
            "Deleting image for note_id=%s by user_id=%s", note_id, user_id)
        note = self.get_object()

        if NoteService.delete_image(note):
            logger.info(
                "Image deleted successfully for note_id=%s by user_id=%s", note.id, note.user_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            logger.error(
                "No image to delete for note_id=%s by user_id=%s", note.id, note.user_id, exc_info=True)
            raise NotFound("No image to delete")


def _get_userid_from_request(request: Request):
    return request.query_params.get('user_id')
