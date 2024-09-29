from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import logging


logger = logging.getLogger('account')


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields) -> 'CustomUser':
        logger.debug('Creating user with email: %s', email)

        if not email:
            logger.error('Attempted to create a user without an email')
            raise ValueError('The Email field must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()

        logger.info('User created successfully with email: %s', email)
        return user

    def create_superuser(self, email, password=None, **extra_fields) -> 'CustomUser':
        logger.debug('Creating superuser with email: %s', email)

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            logger.error(
                'Attempted to create a superuser without is_staff=True')
            raise ValueError('Superuser must have is_staff=True.')

        if extra_fields.get('is_superuser') is not True:
            logger.error(
                'Attempted to create a superuser without is_superuser=True')
            raise ValueError('Superuser must have is_superuser=True.')

        user = self.create_user(email, password, **extra_fields)
        logger.info('Superuser created successfully with email: %s', email)
        return user


class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=False)
    last_name = models.CharField(max_length=30, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    objects: CustomUserManager = CustomUserManager()
