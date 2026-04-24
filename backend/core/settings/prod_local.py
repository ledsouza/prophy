from __future__ import annotations

from os import getenv

from .base import *  # noqa: F403


DEBUG = False

OIDC_AUDIENCE = getenv("OIDC_AUDIENCE", "prod-local")

ALLOW_LOCAL_MEDIA_CLEANUP = True

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
ANYMAIL = {}
DEFAULT_FROM_EMAIL = "no-reply@localhost"