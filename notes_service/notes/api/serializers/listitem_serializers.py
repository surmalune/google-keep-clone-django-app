import logging
from rest_framework.serializers import ModelSerializer, IntegerField
from notes.models import ListItem

logger = logging.getLogger('notes')


class ListItemReadSerializer(ModelSerializer):
    class Meta:
        model = ListItem
        fields = ('id', 'text', 'is_checked')


class ListItemWriteSerializer(ModelSerializer):
    id = IntegerField(required=False, allow_null=True)

    class Meta:
        model = ListItem
        fields = ('id', 'text', 'is_checked', 'order')

    def to_internal_value(self, data):
        if 'id' in data and not str(data['id']).isdigit():
            logger.debug(
                "Invalid 'id' detected: %s. Replacing with None.", data['id'])
            data['id'] = None
        return super().to_internal_value(data)
