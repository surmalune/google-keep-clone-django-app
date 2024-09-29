import logging

from rest_framework import mixins
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.parsers import JSONParser
from rest_framework.generics import GenericAPIView

from notes.models import ListItem
from notes.permissions import IsListItemOwner, IsAuthenticated
from notes.api.serializers.listitem_serializers import ListItemWriteSerializer


logger = logging.getLogger('notes')


class ListItemDetailApi(mixins.UpdateModelMixin, GenericAPIView):
    http_method_names = ['patch']
    permission_classes = [IsAuthenticated, IsListItemOwner]
    parser_classes = [JSONParser]

    serializer_class = ListItemWriteSerializer
    queryset = ListItem.objects.all()

    def patch(self, request: Request, *args, **kwargs) -> Response:
        user_id = _get_userid_from_request(request)
        logger.info(
            "Partially updating item_id=%s by user_id=%s", kwargs['pk'], user_id)
        return self.partial_update(request, *args, **kwargs)


def _get_userid_from_request(request: Request):
    return request.query_params.get('user_id')
