from __future__ import annotations

from os import getenv

from . import prod as prod_settings


for _name in dir(prod_settings):
    if not _name.isupper():
        continue
    globals()[_name] = getattr(prod_settings, _name)


INSTALLED_APPS = [
    *prod_settings.INSTALLED_APPS,
    "django_cypress",
]


ENABLE_CYPRESS_ROUTES = True
OIDC_AUDIENCE = prod_settings.OIDC_AUDIENCE or getenv("OIDC_AUDIENCE", "e2e")


BASE_DIR = prod_settings.BASE_DIR