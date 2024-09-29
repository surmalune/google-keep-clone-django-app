from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger('account')


class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name')


class UserCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(
        required=True, allow_blank=False, max_length=30)
    last_name = serializers.CharField(
        required=False, allow_blank=True, max_length=30)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        logger.debug('Validating registration data: %s', attrs)
        if attrs['password'] != attrs['password2']:
            logger.error('Password fields didn\'t match')
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})
        return super().validate(attrs)


class UserUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False,
        allow_blank=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(
        required=False, allow_blank=False, max_length=30)
    last_name = serializers.CharField(
        required=False, allow_blank=True, max_length=30)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        logger.debug('Validating updating data: %s', attrs)
        password = attrs.get('password')
        password2 = attrs.get('password2')

        if password and not password2:
            logger.error('Password confirmation is missing')
            raise serializers.ValidationError(
                {"password2": "Password confirmation is required."})
        elif password2 and not password:
            logger.error('Password is missing')
            raise serializers.ValidationError(
                {"password": "Password is required."})

        if password and password2 and password != password2:
            logger.error('Passwords didn\'t match')
            raise serializers.ValidationError(
                {"password": "Passwords didn't match."})
        return super().validate(attrs)
