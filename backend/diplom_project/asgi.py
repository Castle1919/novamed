"""ASGI entrypoint for diplom_project."""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'diplom_project.settings')
application = get_asgi_application()
