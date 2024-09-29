import logging

from notes.models import Note
from django.db import DatabaseError, transaction
from notes import validators
from .listitem_services import ListItemService

logger = logging.getLogger('notes')


class NoteService:
    @staticmethod
    @transaction.atomic
    def create(validated_data, user_id) -> Note:
        logger.debug("Initial data for creating a new note: %s",
                     validated_data)
        validated_data = NoteService._adjust_note_type(validated_data)
        logger.debug("Creating a new note with data: %s", validated_data)

        items = validated_data.pop('list_items', [])

        note = Note.objects.create(user_id=user_id, **validated_data)
        logger.debug("Note created with ID: %s", note.id)

        ListItemService.create_list_items(note, items)
        logger.info("Note ID %s created successfully", note.id)
        return note

    @staticmethod
    @transaction.atomic
    def update(note: Note, validated_data) -> Note:
        logger.debug("Initial data for updating the note %s: %s",
                     note, validated_data)
        validated_data = NoteService._adjust_note_type(validated_data)
        logger.debug(
            "Updating note %s with data: %s", note, validated_data)

        if 'list_items' in validated_data:
            items = validated_data.pop('list_items', [])
            ListItemService.update_list_items(note, items)

        for attr, value in validated_data.items():
            setattr(note, attr, value)

        try:
            note.save()
            logger.debug("Attributes updated for note ID: %s", note.id)
        except DatabaseError as e:
            logger.error(
                "Database error updating instance attributes for note ID %s: %s", note.id, str(e), exc_info=True)
            raise

        logger.info("Note ID %s updated successfully", note.id)

        note.refresh_from_db()
        return note

    @staticmethod
    @transaction.atomic
    def delete(note: Note) -> None:
        NoteService.delete_image(note, save=False)

        try:
            note.delete()
            logger.info("Note with note ID %s deleted successfully", note.id)
        except DatabaseError as e:
            logger.error(
                "Database error deleting note ID %s: %s", note.id, str(e), exc_info=True)
            raise

    @staticmethod
    @transaction.atomic
    def delete_image(note: Note, save: bool = True) -> bool:
        if note.image:
            logger.warning("Deleting image for note ID %s", note.id)

            try:
                note.image.delete(save=save)
            except DatabaseError as e:
                logger.error(
                    "Database error deleting image for note ID %s: %s", note.id, str(e), exc_info=True)
                raise

            return True
        return False

    @staticmethod
    def _adjust_note_type(validated_data):
        adjusted_data = validated_data.copy()

        items = adjusted_data.get('list_items', [])
        content = adjusted_data.get('content')
        validators.validate_note_content_and_items(content, items)

        if items:
            adjusted_data['type'] = 'list'
            adjusted_data['content'] = None
        elif 'content' in adjusted_data:
            adjusted_data['type'] = 'text'
            adjusted_data['list_items'] = []

        return adjusted_data
