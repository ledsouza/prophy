from __future__ import annotations

from os import getenv

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403

DEBUG = False

_secret_key = getenv("DJANGO_SECRET_KEY")
if not _secret_key:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be set in production. "
        "A random fallback breaks signing across "
        "multiple Cloud Run instances."
    )
SECRET_KEY = _secret_key

_allowed_hosts = getenv("DJANGO_ALLOWED_HOSTS")
if not _allowed_hosts:
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS must be set in production."
    )
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts.split(",") if h.strip()]

_csrf_origins = getenv("CSRF_TRUSTED_ORIGINS")
if not _csrf_origins:
    raise ImproperlyConfigured(
        "CSRF_TRUSTED_ORIGINS must be set in production."
    )
CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in _csrf_origins.split(",") if o.strip()
]

_cors_origins = getenv("CORS_ALLOWED_ORIGINS")
if not _cors_origins:
    raise ImproperlyConfigured(
        "CORS_ALLOWED_ORIGINS must be set in production."
    )
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in _cors_origins.split(",") if o.strip()
]

if not OIDC_AUDIENCE:  # noqa: F405
    raise ImproperlyConfigured(
        "OIDC_AUDIENCE must be set in production."
    )

# Cloud Run terminates TLS at the load balancer and forwards
# requests over HTTP with X-Forwarded-Proto: https. Without this,
# request.is_secure() returns False and secure cookies break.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# SameSite=None is required for the JWT cookie to cross the origin
# boundary between app.prophy.com and api.prophy.com. Browsers
# mandate Secure=True whenever SameSite=None is used.
AUTH_COOKIE_SAMESITE = "None"
AUTH_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
