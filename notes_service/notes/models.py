from django.db import models
from django.db.models import Q


class NoteType(models.TextChoices):
    TEXT = 'text', 'Text'
    LIST = 'list', 'List'


class NoteColor(models.TextChoices):
    NONE = 'none', 'None'
    RED = 'coral', 'Coral'
    PEACH = 'peach', 'Peach'
    SAND = 'sand', 'Sand'
    SAGE = 'sage', 'Sage'
    FOG = 'fog', 'Fog'
    STORM = 'storm', 'Storm'
    DUSK = 'dusk', 'Dusk'


class NoteStatus(models.TextChoices):
    NORMAL = 'normal', 'Normal'
    PINNED = 'pinned', 'Pinned'
    ARCHIVED = 'archived', 'Archived'
    DELETED = 'deleted', 'Deleted'


class Note(models.Model):
    id = models.BigAutoField(primary_key=True)

    user_id = models.IntegerField(
        null=False, blank=False, editable=False, db_index=True)

    image = models.ImageField(upload_to='note_images/', null=True, blank=True)

    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(null=True, blank=True)
    type = models.CharField(max_length=5, choices=NoteType.choices)

    color = models.CharField(max_length=10, choices=NoteColor.choices, default=NoteColor.NONE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    status = models.CharField(max_length=10, choices=NoteStatus.choices, default=NoteStatus.NORMAL)

    class Meta:
        ordering = ['-status', '-updated_at']

    def __str__(self):
        return f"Note {self.id} (Title: {self.title or 'Untitled'}, Type: {self.type}, User: {self.user_id})"

    def __repr__(self):
        return f"<Note(id={self.id}, title={self.title!r}, type={self.type!r}, user_id={self.user_id}, status={self.status})>"


class ListItem(models.Model):
    id = models.BigAutoField(primary_key=True)

    note = models.ForeignKey(
        Note, related_name='list_items', on_delete=models.CASCADE)

    text = models.CharField(max_length=255, blank=True)
    is_checked = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"ListItem {self.id} (Note: {self.note.id}, Text: {self.text}, Checked: {self.is_checked})"

    def __repr__(self):
        return f"<ListItem(id={self.id}, note_id={self.note.id}, text={self.text!r}, checked={self.is_checked}, order={self.order})>"
