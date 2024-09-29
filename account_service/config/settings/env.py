import os
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()

DJANGO_ENV = os.getenv('DJANGO_ENV', 'dev')

if DJANGO_ENV == 'prod':
    env.read_env(os.path.join(BASE_DIR, '.env'))
    env.read_env(os.path.join(BASE_DIR.parent, '.env'))
else:
    env.read_env(os.path.join(BASE_DIR, '.env.dev'))
