from __future__ import annotations

from .base import *  # noqa: F403


DEBUG = True


def _configure_test_database() -> None:
    """Force a test-only database.

    This prevents accidentally running tests against staging or production.
    """

    global DATABASES  # noqa: PLW0603

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db_test.sqlite3",  # noqa: F405
        }
    }

    db_name = str(DATABASES["default"]["NAME"])
    if "test" not in db_name:
        raise RuntimeError(
            "Refusing to run tests with a non-test database name: " f"{db_name!r}"
        )


_configure_test_database()


PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
