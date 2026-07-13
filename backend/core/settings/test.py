from __future__ import annotations

from . import base as base_settings

for _name in dir(base_settings):
    if not _name.isupper():
        continue
    globals()[_name] = getattr(base_settings, _name)


DEBUG = True

ENABLE_CYPRESS_ROUTES = True


INSTALLED_APPS = [
    *base_settings.INSTALLED_APPS,
    "django_cypress",
]


BASE_DIR = base_settings.BASE_DIR


# Force a test-only database. This prevents accidentally running tests
# against staging or production.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db_test.sqlite3",
    }
}

_db_name = str(DATABASES["default"]["NAME"])
if "test" not in _db_name:
    raise RuntimeError(
        f"Refusing to run tests with a non-test database name: {_db_name!r}"
    )


PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
