import os
from django.core.exceptions import ImproperlyConfigured

env = os.getenv('DJANGO_ENV', 'dev')

if env == 'dev':
    from .dev import *
elif env == 'prod':
    from .prod import *
else:
    raise ImproperlyConfigured(f"Unknown env: {env}")