from __future__ import annotations

from .base import *  # noqa: F403


DEBUG = False

if not OIDC_AUDIENCE:  # noqa: F405
    raise ValueError(
        "The OIDC_AUDIENCE environment variable must be set in production."
    )
