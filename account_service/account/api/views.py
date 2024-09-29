import logging

from account.services import UserService
from .serializers import UserCreateSerializer, UserUpdateSerializer, UserReadSerializer
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger('account')


class RegisterView(GenericAPIView):
    http_method_names = ['post']
    permission_classes = (AllowAny,)
    serializer_class = UserCreateSerializer

    def post(self, request: Request, *args, **kwargs) -> Response:
        logger.debug('Received registration request')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        logger.debug('Performing create user with data: %s',
                     serializer.validated_data)
        user = UserService.create(serializer.validated_data)
        logger.info('User created with email: %s', user.email)

        response_serializer = UserReadSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class UserView(GenericAPIView):
    http_method_names = ['get', 'patch']
    permission_classes = (IsAuthenticated,)
    serializer_class = UserUpdateSerializer

    def get(self, request: Request) -> Response:
        logger.debug('Received user info request')
        
        user = request.user
        user_data = {
            "user_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
        
        logger.info('User info retrieved successfully for user ID: %s', user.id)
        return Response(user_data)

    def patch(self, request: Request) -> Response:
        logger.debug('Received user info update request')

        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        user = UserService.update(user, serializer.validated_data)
        logger.info('User info updated successfully for user ID: %s', user.id)

        response_serializer = UserReadSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def check_email_exists(request: Request) -> Response:
    logger.debug('Received check email exists request')
    email = request.query_params.get('email')

    if not email:
        logger.warning('Email not provided in request')
        return Response({'detail': 'Email not provided'}, status=status.HTTP_400_BAD_REQUEST)

    exists = User.objects.filter(email=email).exists()
    logger.info('Email existence check result for %s: %s', email, exists)
    return Response({'exists': exists}, status=status.HTTP_200_OK)
