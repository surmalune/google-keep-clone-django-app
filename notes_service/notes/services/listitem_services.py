import logging
from django.db import DatabaseError
from notes.models import ListItem, Note

logger = logging.getLogger('notes')


class ListItemService:
    @staticmethod
    def create_list_items(note: Note, items) -> None:
        if not note or not items:
            return

        list_items = [ListItem(note=note, **item) for item in items]

        try:
            ListItem.objects.bulk_create(list_items)
            logger.debug(
                "Created %s list items for note ID: %s", len(list_items), note.id)
        except DatabaseError as e:
            logger.error(
                "Database error creating list items for note ID %s: %s", note.id, str(e), exc_info=True)
            raise

    @staticmethod
    def update_list_items(note, items) -> None:
        if not note:
            return

        existing_ids = [item['id'] for item in items if 'id' in item]
        note.list_items.exclude(id__in=existing_ids).delete()
        logger.debug(
            "Deleted list items not included in the update for note ID: %s", note.id)

        if not items:
            return

        items_to_update = []
        items_to_create = []

        for item in items:
            item_id = item.pop('id', None)
            if item_id:
                items_to_update.append(ListItem(id=item_id, **item))
            else:
                items_to_create.append(ListItem(note=note, **item))

        try:
            if items_to_update:
                ListItem.objects.bulk_update(items_to_update, fields=[
                                             'text', 'is_checked', 'order'])
                logger.debug("Updated list items for note ID: %s", note.id)

            if items_to_create:
                ListItem.objects.bulk_create(items_to_create)
                logger.debug("Created new list items for note ID: %s", note.id)
        except DatabaseError as e:
            logger.error(
                "Database error processing list items for note ID %s: %s", note.id, str(e), exc_info=True)
            raise
