from __future__ import annotations

from . import base as base_settings


for _name in dir(base_settings):
    if not _name.isupper():
        continue
    globals()[_name] = getattr(base_settings, _name)


DEBUG = True


INSTALLED_APPS = [
    *base_settings.INSTALLED_APPS,
    "django_cypress",
]


BASE_DIR = base_settings.BASE_DIR
