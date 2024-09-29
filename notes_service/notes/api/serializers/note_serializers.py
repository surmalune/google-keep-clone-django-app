import logging
from rest_framework.serializers import ModelSerializer, SerializerMethodField
from .listitem_serializers import ListItemReadSerializer, ListItemWriteSerializer
from notes.models import Note
from notes import validators

logger = logging.getLogger('notes')


class NoteReadSerializer(ModelSerializer):
    list_items = ListItemReadSerializer(many=True)
    image = SerializerMethodField()

    class Meta:
        model = Note
        fields = ('id', 'image', 'title', 'content', 'type', 'color',
                  'created_at', 'updated_at', 'status', 'list_items')

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


class NoteCreateSerializer(ModelSerializer):
    list_items = ListItemWriteSerializer(many=True, required=False)

    class Meta:
        model = Note
        fields = ('id', 'image', 'title', 'color', 'content', 'list_items')

    def validate(self, attrs):
        logger.debug("Initial data: %s", self.initial_data)
        logger.debug("Validated data: %s", attrs)

        content = attrs.get('content')
        list_items = attrs.get('list_items', [])
        validators.validate_note_content_and_items(content, list_items)
        return attrs


class NoteUpdateSerializer(ModelSerializer):
    list_items = ListItemWriteSerializer(many=True, required=False)

    class Meta:
        model = Note
        fields = ('id', 'image', 'title', 'color',
                  'content', 'list_items', 'status')

    def validate(self, attrs):
        logger.debug("Initial data: %s", self.initial_data)
        logger.debug("Validated data: %s", attrs)

        content = attrs.get('content')
        list_items = attrs.get('list_items', [])
        validators.validate_note_content_and_items(content, list_items)
        return attrs
