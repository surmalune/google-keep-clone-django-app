from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from notes.models import Note


class NoteImageDestroyApiTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user_id = 1
        cls.other_user_id = 2
        cls.note_with_image = Note.objects.create(
            title='Test Note with Image',
            content='This note has an image.',
            user_id=cls.user_id,
            image='path/to/image.jpg'
        )
        cls.note_without_image = Note.objects.create(
            title='Test Note without Image',
            content='This note does not have an image.',
            user_id=cls.user_id
        )
        cls.url_with_image = reverse('note-image-delete', kwargs={'note_id': cls.note_with_image.id})
        cls.url_without_image = reverse('note-image-delete', kwargs={'note_id': cls.note_without_image.id})

    @patch('notes.services.note_services.NoteService.delete_image')
    def test_delete_image_success(self, mock_delete_image):
        mock_delete_image.return_value = True

        response = self.client.delete(self.url_with_image + '?user_id={}'.format(self.user_id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        mock_delete_image.assert_called_once_with(self.note_with_image)

    @patch('notes.services.note_services.NoteService.delete_image')
    def test_delete_image_not_found(self, mock_delete_image):
        mock_delete_image.return_value = False

        response = self.client.delete(self.url_with_image + '?user_id={}'.format(self.user_id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        mock_delete_image.assert_called_once_with(self.note_with_image)

    def test_delete_image_forbidden(self):
        other_user_note = Note.objects.create(
            title='Other User Note',
            content='This note belongs to another user.',
            user_id=self.other_user_id,
            image='path/to/another_image.jpg'
        )
        url_forbidden = reverse('note-image-delete',
                                kwargs={'note_id': other_user_note.id})

        response = self.client.delete(url_forbidden + '?user_id={}'.format(self.user_id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_image_unauthenticated(self):
        response = self.client.delete(self.url_with_image)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
