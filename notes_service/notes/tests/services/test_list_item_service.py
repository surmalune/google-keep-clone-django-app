from django.test import TestCase
from notes.models import ListItem, Note
from notes.services.listitem_services import ListItemService
from unittest.mock import patch
from django.db import DatabaseError


class ListItemServiceTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.note = Note.objects.create(
            title='Test Note',
            content='This is a test note.',
            user_id=1
        )

    def test_create_list_items_success(self):
        items = [
            {'text': 'Item 1', 'is_checked': False},
            {'text': 'Item 2', 'is_checked': True}
        ]
        ListItemService.create_list_items(self.note, items)

        self.assertEqual(ListItem.objects.count(), 2)
        self.assertEqual(ListItem.objects.filter(note=self.note).count(), 2)

    def test_update_list_items_success(self):
        existing_item = ListItem.objects.create(
            text='Existing Item',
            is_checked=False,
            note=self.note
        )
        items_to_update = [
            {'id': existing_item.id, 'text': 'Updated Item', 'is_checked': True}
        ]
        items_to_create = [
            {'text': 'New Item', 'is_checked': False}
        ]

        ListItemService.update_list_items(
            self.note, items_to_update + items_to_create)

        self.assertEqual(ListItem.objects.count(), 2)
        self.assertEqual(ListItem.objects.get(
            id=existing_item.id).text, 'Updated Item')

    @patch('notes.services.listitem_services.ListItem.objects.bulk_create')
    @patch('notes.services.listitem_services.logger')
    def test_create_list_items_database_error(self, mock_logger, mock_bulk_create):
        mock_bulk_create.side_effect = DatabaseError("Database error")
        items = [{'text': 'Item 1', 'is_checked': False}]

        with self.assertRaises(DatabaseError):
            ListItemService.create_list_items(self.note, items)

        mock_logger.error.assert_called_with(
            "Database error creating list items for note ID %s: %s", self.note.id, "Database error", exc_info=True
        )

    @patch('notes.services.listitem_services.ListItem.objects.bulk_create')
    @patch('notes.services.listitem_services.ListItem.objects.bulk_update')
    @patch('notes.services.listitem_services.ListItem.objects.exclude')
    @patch('notes.services.listitem_services.logger')
    def test_update_list_items_database_error(self, mock_logger, mock_exclude, mock_bulk_update, mock_bulk_create):
        mock_bulk_update.side_effect = DatabaseError("Database error")
        items_to_update = [{'id': 1, 'text': 'Item', 'is_checked': False}]

        with self.assertRaises(DatabaseError):
            ListItemService.update_list_items(self.note, items_to_update)

        mock_logger.error.assert_called_with(
            "Database error processing list items for note ID %s: %s", self.note.id, "Database error", exc_info=True
        )
