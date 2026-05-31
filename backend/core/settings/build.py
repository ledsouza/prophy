from __future__ import annotations

from .base import *  # noqa: F403

# Used only during `docker build` to run `collectstatic`.
# The base defaults (SQLite, local STATIC_ROOT, random SECRET_KEY) are
# sufficient — no runtime values are needed because collectstatic makes
# no HTTP requests and processes no HTTP responses.
DEBUG = False

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    },
}
