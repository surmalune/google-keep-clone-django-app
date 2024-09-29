from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from notes.models import Note
from notes.api.serializers.note_serializers import NoteReadSerializer, NoteUpdateSerializer


class NoteApiTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.url = reverse('note-list-create')
        cls.user_id = 1
        cls.note = Note.objects.create(
            title='Test Note',
            content='This is a test note.',
            user_id=cls.user_id
        )

    def test_get_notes(self):
        response = self.client.get(self.url, {'user_id': str(self.user_id)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]['title'], self.note.title)
        self.assertEqual(response.data[0]['content'], self.note.content)

    def test_get_notes_filtered(self):
        response = self.client.get(
            self.url, {'status': ['normal'], 'user_id': str(self.user_id)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    @patch('notes.api.views.note_views._get_userid_from_request')
    def test_post_note_success(self, mock_get_userid):
        mock_get_userid.return_value = self.user_id

        data = {
            'title': 'New Note',
            'content': 'This is a new note.',
            'type': 'text',
            'color': 'sage',
            'status': 'normal',
            'list_items': []
        }
        response = self.client.post(
            self.url + '?user_id={}'.format(self.user_id), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], data['title'])
        self.assertEqual(response.data['content'], data['content'])

    @patch('notes.api.views.note_views._get_userid_from_request')
    def test_post_note_invalid(self, mock_get_userid):
        mock_get_userid.return_value = self.user_id

        data = {
            'title': 'Invalid Note',
            'content': 'This is an invalid note with list items.',
            'type': 'text',
            'list_items': [{'text': 'Item 1'}]
        }
        response = self.client.post(
            self.url + '?user_id={}'.format(self.user_id), data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_note_serializer(self):
        response = self.client.get(self.url, {'user_id': str(self.user_id)})
        serializer = NoteReadSerializer(Note.objects.first())
        
        self.assertEqual(response.data[0], serializer.data)

    @patch('notes.api.views.note_views._get_userid_from_request')
    def test_post_note_serializer(self, mock_get_userid):
        mock_get_userid.return_value = self.user_id

        data = {
            'title': 'Another Note',
            'type': 'list',
            'list_items': [{'text': 'Item 1', 'is_checked': False}]
        }
        response = self.client.post(
            self.url + '?user_id={}'.format(self.user_id), data, format='json')
        serializer = NoteUpdateSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], data['title'])

    def test_get_notes_forbidden(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('notes.api.views.note_views._get_userid_from_request')
    def test_post_note_unauthenticated(self, mock_get_userid):
        mock_get_userid.return_value = self.user_id

        data = {
            'title': 'Unauthenticated Note',
            'content': 'Content here.',
            'type': 'text'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
