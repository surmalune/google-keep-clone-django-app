from .base import *

DEBUG = False

ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=[])
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])

DATABASES['default'] = {
    'ENGINE': env('DB_ENGINE'),
    'NAME': env('NOTES_DB_NAME'),
    'USER': env('DB_USER'),
    'PASSWORD': env('DB_PASSWORD'),
    'HOST': env('DB_HOST'),
    'PORT': env('DB_PORT'),
}

LOGGING['handlers']['notes_file']['level'] = 'INFO'