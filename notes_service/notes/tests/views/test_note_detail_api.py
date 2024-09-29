from rest_framework.test import APITestCase
from django.urls import reverse
from notes.models import Note
from rest_framework import status
from notes.api.serializers.note_serializers import NoteReadSerializer


class NoteDetailApiTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user_id = 1
        cls.other_user_id = 2
        cls.note = Note.objects.create(
            title='Test Note',
            content='This is a test note.',
            user_id=cls.user_id
        )
        cls.url = reverse('note-detail', kwargs={'pk': cls.note.id})

    def test_get_note_success(self):
        response = self.client.get(self.url, {'user_id': str(self.user_id)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = NoteReadSerializer(self.note)
        self.assertEqual(response.data, serializer.data)

    def test_patch_note_success(self):
        data = {
            'title': 'Updated Title',
            'content': 'Updated content.',
        }
        response = self.client.patch(
            self.url + '?user_id={}'.format(self.user_id), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_note = Note.objects.get(pk=self.note.id)
        self.assertEqual(updated_note.title, data['title'])
        self.assertEqual(updated_note.content, data['content'])

    def test_patch_note_invalid(self):
        data = {
            'color': 'invalid',
        }
        response = self.client.patch(
            self.url + '?user_id={}'.format(self.user_id), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_note_success(self):
        response = self.client.delete(
            self.url + '?user_id={}'.format(self.user_id))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(pk=self.note.id).exists())

    def test_get_note_forbidden(self):
        response = self.client.get(self.url + '?user_id={}'.format(self.other_user_id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_note_unauthenticated(self):
        data = {
            'title': 'Unauthenticated Update',
            'content': 'Content here.',
        }
        response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_note_unauthenticated(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
