from django.test import TestCase
from notes.api.serializers.listitem_serializers import ListItemWriteSerializer, ListItemReadSerializer
from notes.api.serializers.note_serializers import NoteUpdateSerializer, NoteReadSerializer
from ..models import Note, ListItem
from rest_framework.exceptions import ValidationError


class SerializerTests(TestCase):

    def setUp(self):
        self.user_id = 1
        self.note_data = {
            'title': 'Test Note',
            'content': 'Test content',
            'color': 'dusk',
            'status': 'normal'
        }
        self.list_item_data = {
            'text': 'Test item',
            'is_checked': False,
            'order': 1
        }

    def test_note_write_serializer_valid(self):
        serializer = NoteUpdateSerializer(data=self.note_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.validated_data['title'], self.note_data['title'])

    def test_note_write_serializer_invalid_both_content_and_list_items(self):
        self.note_data['list_items'] = [self.list_item_data]

        serializer = NoteUpdateSerializer(data=self.note_data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_list_item_write_serializer_valid(self):
        serializer = ListItemWriteSerializer(data=self.list_item_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.validated_data['text'], self.list_item_data['text'])

    def test_list_item_write_serializer_invalid_id(self):
        self.list_item_data['id'] = 'invalid_id'
        serializer = ListItemWriteSerializer(data=self.list_item_data)
        self.assertTrue(serializer.is_valid())
        self.assertIsNone(serializer.validated_data['id'])

    def test_note_read_serializer(self):
        note = Note.objects.create(user_id=self.user_id, **self.note_data)
        list_item = ListItem.objects.create(note=note, **self.list_item_data)

        serializer = NoteReadSerializer(note)
        serialized_data = serializer.data

        self.assertEqual(serialized_data['title'], note.title)
        self.assertEqual(len(serialized_data['list_items']), 1)
        self.assertEqual(
            serialized_data['list_items'][0]['text'], list_item.text)

    def test_list_item_read_serializer(self):
        note = Note.objects.create(user_id=self.user_id, **self.note_data)
        list_item = ListItem.objects.create(note=note, **self.list_item_data)

        serializer = ListItemReadSerializer(list_item)
        serialized_data = serializer.data

        self.assertEqual(serialized_data['text'], list_item.text)
        self.assertEqual(serialized_data['is_checked'], list_item.is_checked)
