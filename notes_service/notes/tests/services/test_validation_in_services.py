from django.test import TestCase
from notes.models import Note, ListItem
from notes.services.note_services import NoteService
from rest_framework.exceptions import ValidationError


class NoteServiceValidationTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user_id = 1
        cls.text_note = Note.objects.create(
            title='Initial text Note',
            content='Initial content.',
            type='text',
            color='none',
            user_id=cls.user_id
        )
        cls.list_note = Note.objects.create(
            title='Initial list Note',
            color='sage',
            type='list',
            user_id=cls.user_id
        )
        ListItem.objects.create(note=cls.list_note, text='New Item 1')

    def test_create_note_with_content_only(self):
        validated_data = {
            'title': 'Note with Content',
            'content': 'This is a text note.',
            'color': 'sage'
        }

        note = NoteService.create(validated_data, self.user_id)

        self.assertIsInstance(note, Note)
        self.assertEqual(note.title, validated_data['title'])
        self.assertEqual(note.content, validated_data['content'])
        self.assertEqual(note.type, 'text')
        self.assertEqual(note.color, 'sage')
        self.assertEqual(note.user_id, self.user_id)
        self.assertEqual(note.list_items.count(), 0)

    def test_create_note_with_list_items_only(self):
        validated_data = {
            'title': 'Note with List Items',
            'list_items': [{'text': 'Item 1'}, {'text': 'Item 2'}],
            'color': 'fog'
        }

        note = NoteService.create(validated_data, self.user_id)

        self.assertIsInstance(note, Note)
        self.assertEqual(note.title, validated_data['title'])
        self.assertIsNone(note.content)
        self.assertEqual(note.type, 'list')
        self.assertEqual(note.color, 'fog')
        self.assertEqual(note.user_id, self.user_id)
        self.assertEqual(note.list_items.count(), 2)
        self.assertEqual(note.list_items.first().text, 'Item 1')

    def test_create_note_with_content_and_list_items(self):
        validated_data = {
            'title': 'Invalid Note',
            'content': 'This note has both content and list items.',
            'list_items': [{'text': 'Item 1'}],
            'color': 'dusk'
        }

        with self.assertRaises(ValidationError) as context:
            NoteService.create(validated_data, self.user_id)

        error_details = str(context.exception)
        self.assertIn(
            'Note cannot have both content and list_items at the same time.', error_details)

    def test_update_note_add_list_items_switch_type(self):
        validated_data = {
            'list_items': [{'text': 'New Item 1'}, {'text': 'New Item 2'}]
        }

        updated_note = NoteService.update(self.text_note, validated_data)

        self.text_note.refresh_from_db()
        self.assertEqual(self.text_note.type, 'list')
        self.assertIsNone(self.text_note.content)
        self.assertEqual(self.text_note.list_items.count(), 2)
        self.assertEqual(self.text_note.list_items.first().text, 'New Item 1')

    def test_update_note_add_content_switch_type(self):
        validated_data = {
            'content': 'Switching to text note.'
        }

        updated_note = NoteService.update(self.list_note, validated_data)

        self.list_note.refresh_from_db()
        self.assertEqual(self.list_note.type, 'text')
        self.assertEqual(self.list_note.content, 'Switching to text note.')
        self.assertEqual(self.list_note.list_items.count(), 0)

    def test_update_text_note_with_no_changes(self):
        validated_data = {}

        updated_note = NoteService.update(self.text_note, validated_data)

        self.text_note.refresh_from_db()
        self.assertEqual(updated_note, self.text_note)
        self.assertEqual(self.text_note.title, 'Initial text Note')
        self.assertEqual(self.text_note.content, 'Initial content.')
        self.assertEqual(self.text_note.type, 'text')
        self.assertEqual(self.text_note.list_items.count(), 0)

    def test_update_list_note_with_no_changes(self):
        validated_data = {}

        updated_note = NoteService.update(self.list_note, validated_data)

        self.list_note.refresh_from_db()
        self.assertEqual(updated_note, self.list_note)
        self.assertEqual(self.list_note.title, 'Initial list Note')
        self.assertEqual(self.list_note.type, 'list')
        self.assertEqual(self.list_note.list_items.count(), 1)

    def test_update_note_change_title_only(self):
        validated_data = {
            'title': 'Updated Title'
        }

        updated_note = NoteService.update(self.text_note, validated_data)

        self.text_note.refresh_from_db()
        self.assertEqual(self.text_note.title, 'Updated Title')
        self.assertEqual(self.text_note.content, 'Initial content.')
        self.assertEqual(self.text_note.type, 'text')
        self.assertEqual(self.text_note.list_items.count(), 0)
