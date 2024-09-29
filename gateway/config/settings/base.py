from pathlib import Path
from .env import env

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('DJANGO_SECRET_KEY')

ACCOUNT_SERVICE_URL = env('ACCOUNT_SERVICE_URL')
NOTES_SERVICE_URL = env('NOTES_SERVICE_URL')

# Application definition

INSTALLED_APPS = [
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'config.middlewares.TokenVerificationMiddleware',
    "django.middleware.common.CommonMiddleware",
]

CACHES = {
    'default': {
        'BACKEND': env('CACHE_BACKEND'),
        'LOCATION': env('CACHE_LOCATION'),
        'OPTIONS': {
            'CLIENT_CLASS': env('CACHE_CLIENT_CLASS'),
        },
        'TIMEOUT': 300,
    }
}

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

# Internationalization

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'gateway_file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'logs/gateway.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'gateway_file'],
            'level': 'ERROR',
            'propagate': True,
        },
        'gateway': {
            'handlers': ['console', 'gateway_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
