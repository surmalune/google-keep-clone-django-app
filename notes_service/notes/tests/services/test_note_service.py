from django.test import TestCase
from django.db import DatabaseError
from notes.models import Note, ListItem
from notes.services.note_services import NoteService
from unittest.mock import patch, MagicMock


class NoteServiceIntegrationTests(TestCase):

    def setUp(self):
        self.user_id = 1
        self.note = Note.objects.create(
            title='Test Note',
            content='This is a test note.',
            user_id=self.user_id
        )

    def test_create_note_success(self):
        validated_data = {
            'title': 'New Note',
            'content': 'This is a new note.',
        }

        note = NoteService.create(validated_data, self.user_id)

        self.assertIsInstance(note, Note)
        self.assertEqual(note.title, validated_data['title'])
        self.assertEqual(note.content, validated_data['content'])

    @patch('notes.services.listitem_services.ListItemService.create_list_items')
    def test_create_note_success_with_mock(self, mock_create_list_items):
        user_id = 1
        validated_data = {
            'title': 'New Note',
            'list_items': [{'text': 'Item 1'}]
        }

        note = MagicMock(id=1)
        with patch('notes.models.Note.objects.create', return_value=note) as mock_create:
            result = NoteService.create(validated_data, user_id)

        list_items = validated_data.pop('list_items')

        mock_create.assert_called_once()
        mock_create_list_items.assert_called_once_with(note, list_items)
        self.assertEqual(result, note)

    def test_update_note_success(self):
        validated_data = {
            'title': 'Updated Note',
            'list_items': [{'text': 'Updated Item 1'}]
        }

        updated_note = NoteService.update(self.note, validated_data)

        self.note.refresh_from_db()
        self.assertEqual(self.note.title, validated_data['title'])
        self.assertEqual(self.note.list_items.count(), 1)

    @patch('notes.services.listitem_services.ListItemService.update_list_items')
    def test_update_note_success_with_mock(self, mock_update_list_items):
        note = MagicMock(id=1)
        validated_data = {
            'title': 'Updated Note',
            'list_items': [{'text': 'Updated Item 1'}]
        }

        list_items = validated_data['list_items']

        with patch.object(note, 'save') as mock_save:
            result = NoteService.update(note, validated_data)

        for attr, value in validated_data.items():
            setattr(note, attr, value)

        mock_save.assert_called_once()
        mock_update_list_items.assert_called_once_with(note, list_items)
        self.assertEqual(result, note)

    def test_delete_note_success(self):
        ListItem.objects.create(note=self.note, text='Item 1')
        NoteService.delete(self.note)

        self.assertFalse(Note.objects.filter(id=self.note.id).exists())

    @patch('notes.services.note_services.NoteService.delete_image')
    def test_delete_note_success_with_mock(self, mock_delete_image):
        note = MagicMock(id=1)
        mock_delete_image.return_value = True

        with patch.object(note, 'delete') as mock_delete:
            NoteService.delete(note)

        mock_delete_image.assert_called_once_with(note, save=False)
        mock_delete.assert_called_once()

    def test_delete_image_success(self):
        self.note.image = 'path/to/image.jpg'
        self.note.save()
        self.assertTrue(self.note.image)

        result = NoteService.delete_image(self.note)

        self.assertTrue(result)
        self.assertFalse(self.note.image)

    @patch('notes.models.Note.delete')
    def test_delete_image_success_with_mock(self, mock_delete):
        note = MagicMock(id=1)
        note.image = MagicMock()

        result = NoteService.delete_image(note)

        note.image.delete.assert_called_once_with(save=True)
        self.assertTrue(result)

    def test_delete_image_no_image(self):
        self.note.image = None
        self.note.save()
        result = NoteService.delete_image(self.note)

        self.assertFalse(result)

    @patch('notes.models.Note.delete')
    def test_delete_image_no_image_with_mock(self, mock_delete):
        note = MagicMock(id=1)
        note.image = None

        result = NoteService.delete_image(note)

        mock_delete.assert_not_called()
        self.assertFalse(result)

    def test_create_note_database_error(self):
        user_id = 1
        validated_data = {
            'title': 'New Note',
            'content': 'This is a new note.',
        }
        with patch('notes.models.Note.objects.create') as mock_create:
            mock_create.side_effect = DatabaseError("Database error")
            with self.assertRaises(DatabaseError):
                NoteService.create(validated_data, user_id)
