from django.core.exceptions import ValidationError, PermissionDenied
from django.http import Http404
from rest_framework import exceptions
from rest_framework.serializers import as_serializer_error
from rest_framework.views import exception_handler

def custom_exception_handler(exc, ctx):
    if isinstance(exc, ValidationError):
        exc = exceptions.ValidationError(as_serializer_error(exc))

    if isinstance(exc, Http404):
        exc = exceptions.NotFound(exc.args[0] if exc.args else None)

    if isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied(exc.args[0] if exc.args else None)

    response = exception_handler(exc, ctx)

    if response is None:
        return response

    if isinstance(exc.detail, (list, dict)):
        response.data = {"detail": response.data}

    return response