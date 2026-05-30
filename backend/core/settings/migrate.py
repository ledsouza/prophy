from __future__ import annotations

from os import getenv

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403

# Minimal settings for the migration Cloud Run Job.
# Extends base to get the database connection and app config
# (DATABASE_ENGINE + POSTGRES_* env vars are read automatically).
# Does not call build_production_storages() or guard OIDC/CORS/CSRF —
# none of those are needed to run management commands.

DEBUG = False

_secret_key = getenv("DJANGO_SECRET_KEY")
if not _secret_key:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be set for the migration job."
    )
SECRET_KEY = _secret_key
