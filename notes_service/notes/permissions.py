import logging
from rest_framework.permissions import BasePermission

logger = logging.getLogger('notes')


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        logger.debug('Check IsAuthenticated permission')
        if not request.user:
            return False

        user_id = request.query_params.get('user_id')
        if user_id is None:
            return False

        try:
            user_id = int(user_id)
        except ValueError:
            return False

        return True


class IsNoteOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        logger.debug('Check IsNoteOwner permission')
        user_id = request.query_params.get('user_id')

        if user_id is None:
            return False

        try:
            user_id = int(user_id)
        except ValueError:
            return False

        return obj.user_id == user_id


class IsListItemOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        logger.debug('Check IsListItemOwner permission')
        user_id = request.query_params.get('user_id')

        if user_id is None:
            return False

        try:
            user_id = int(user_id)
        except ValueError:
            return False

        note = obj.note
        return note.user_id == user_id
