import logging
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()
logger = logging.getLogger('account')

class UserService:
    @staticmethod
    @transaction.atomic
    def create(validated_data):
        logger.debug('Creating user with validated data: %s', validated_data)
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        logger.info('User created successfully with email: %s',
                    validated_data['email'])
        return user
    
    @staticmethod
    @transaction.atomic
    def update(user, validated_data):
        logger.debug('Updating user with validated data: %s', validated_data)
        for attr, value in validated_data.items():
            setattr(user, attr, value)

        password = validated_data.pop('password', None)
        if password:
            user.set_password(password)

        user.save()

        logger.info('User updated successfully')
        return user