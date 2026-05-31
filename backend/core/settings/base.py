from __future__ import annotations

from datetime import timedelta
from os import getenv, path
from pathlib import Path
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]

dotenv_file = BASE_DIR.joinpath(".env")
if path.isfile(dotenv_file):
    load_dotenv(dotenv_file)

SECRET_KEY = getenv("DJANGO_SECRET_KEY", get_random_secret_key())
DEBUG = getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = getenv("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

FRONTEND_URL = getenv("FRONTEND_URL", "http://localhost:3000")

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    FRONTEND_URL,
]
CORS_ALLOW_CREDENTIALS = True
ENABLE_CYPRESS_ROUTES = False
ALLOW_LOCAL_MEDIA_CLEANUP = False
EXPORT_CYPRESS_FIXTURES = False

INSTALLED_APPS = [
    "core.apps.ProphyAdminConfig",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "storages",
    "rest_framework",
    "djoser",
    "corsheaders",
    "rest_framework_simplejwt",
    "django_filters",
    "drf_yasg",
    "anymail",
    "users",
    "clients_management.apps.GestaoClientesConfig",
    "requisitions",
    "materials",
]

MIDDLEWARE = [
    "core.middleware.HealthCheckHostMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

def _get_default_sqlite_database() -> dict[str, str | Path]:
    return {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }


def _get_postgresql_database() -> dict[str, str | int]:
    database_url = getenv("DATABASE_URL")

    if database_url:
        parsed = urlparse(database_url)
        engine = "django.db.backends.postgresql"

        return {
            "ENGINE": engine,
            "NAME": parsed.path.lstrip("/"),
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "",
            "PORT": parsed.port or 5432,
        }

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": getenv("POSTGRES_DB", "prophy"),
        "USER": getenv("POSTGRES_USER", "prophy"),
        "PASSWORD": getenv("POSTGRES_PASSWORD", "prophy"),
        "HOST": getenv("POSTGRES_HOST", "postgres"),
        "PORT": int(getenv("POSTGRES_PORT", "5432")),
    }


def _get_database_settings() -> dict[str, dict[str, str | int | Path]]:
    database_engine = getenv("DATABASE_ENGINE", "sqlite").lower()

    if database_engine == "postgres":
        return {"default": _get_postgresql_database()}

    return {"default": _get_default_sqlite_database()}


DATABASES = _get_database_settings()

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR.joinpath("static")

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR.joinpath("media")

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

OIDC_AUDIENCE = getenv("OIDC_AUDIENCE")

DJOSER = {
    "TOKEN_MODEL": None,
    "USER_CREATE_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_URL": "auth/password-reset/{uid}/{token}",
    "EMAIL_FRONTEND_DOMAIN": FRONTEND_URL.split("/")[-1],
    "EMAIL_FRONTEND_SITE_NAME": "Prophy",
    "SET_PASSWORD_RETYPE": True,
    "USER_ID_FIELD": "id",
    "LOGIN_FIELD": "cpf",
    "SERIALIZERS": {
        "current_user": "users.serializers.CurrentUserSerializer",
        "user": "users.serializers.CurrentUserSerializer",
    },
}

AUTH_COOKIE = "access"
AUTH_COOKIE_MAX_AGE = 60 * 60 * 24
AUTH_COOKIE_SECURE = getenv("AUTH_COOKIE_SECURE", "True") == "True"
AUTH_COOKIE_HTTP_ONLY = True
AUTH_COOKIE_PATH = "/"
AUTH_COOKIE_SAMESITE = "Lax"

SWAGGER_SETTINGS = {
    "SECURITY_DEFINITIONS": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": (
                "JWT Authorization header using the Bearer scheme. "
                'Example: "Authorization: Bearer {token}"'
            ),
        }
    },
    "USE_SESSION_AUTH": False,
    "DEFAULT_MODEL_RENDERING": "example",
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.authentication.CustomJWTAuthentication",
        "users.authentication.GoogleOIDCAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

EMAIL_BACKEND = "anymail.backends.mailgun.EmailBackend"
ANYMAIL = {
    "MAILGUN_API_KEY": getenv("MAILGUN_API_KEY"),
    "MAILGUN_SENDER_DOMAIN": getenv("DOMAIN"),
    "MAILGUN_API_URL": getenv("MAILGUN_API_URL", "https://api.mailgun.net/v3"),
}
DEFAULT_FROM_EMAIL = getenv("DEFAULT_FROM_EMAIL")

NOTIFICATION_OVERRIDE_RECIPIENTS = getenv("NOTIFICATION_OVERRIDE_RECIPIENTS")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.UserAccount"


def build_production_storages() -> dict[str, dict]:
    """STORAGES config for real production: media on GCS via ADC, static via WhiteNoise.

    Uses Application Default Credentials — the attached Cloud Run service
    account is picked up automatically by django-storages at runtime.
    GCS_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS are not required.

    Raises ImproperlyConfigured if GCS_BUCKET_NAME is unset so the
    container fails fast instead of silently writing to ephemeral local disk.
    """
    gcs_bucket_name = getenv("GCS_BUCKET_NAME")
    if not gcs_bucket_name:
        raise ImproperlyConfigured(
            "GCS_BUCKET_NAME must be set when running production settings. "
            "Media uploads require Google Cloud Storage; refusing to fall "
            "back to ephemeral local disk."
        )
    return {
        "default": {
            "BACKEND": "storages.backends.gcloud.GoogleCloudStorage",
            "OPTIONS": {
                "bucket_name": gcs_bucket_name,
                "iam_sign_blob": True,
                "location": "media",
            },
        },
        "staticfiles": {
            "BACKEND": (
                "whitenoise.storage.CompressedManifestStaticFilesStorage"
            ),
        },
    }
