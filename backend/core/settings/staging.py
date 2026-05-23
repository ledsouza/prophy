from __future__ import annotations

from os import getenv

from . import base as base_settings


for _name in dir(base_settings):
    if not _name.isupper():
        continue
    globals()[_name] = getattr(base_settings, _name)


DEBUG = False

INSTALLED_APPS = [
    *base_settings.INSTALLED_APPS,
    "django_cypress",
]


ENABLE_CYPRESS_ROUTES = True
EXPORT_CYPRESS_FIXTURES = True
ALLOW_LOCAL_MEDIA_CLEANUP = True
OIDC_AUDIENCE = getenv("OIDC_AUDIENCE", "staging")

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
ANYMAIL = {}
DEFAULT_FROM_EMAIL = "no-reply@localhost"

BASE_DIR = base_settings.BASE_DIR
