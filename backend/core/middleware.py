from __future__ import annotations

from collections.abc import Callable

from django.http import HttpRequest, HttpResponse


HEALTH_CHECK_PATH = "/api/health/"


class HealthCheckHostMiddleware:
    """Normalise the Host header for the Cloud Run startup probe.

    Cloud Run sends startup-probe requests to the container's internal
    IP, so the probe's Host header is an internal address that cannot be
    listed in ALLOWED_HOSTS. Django would reject it with 400
    DisallowedHost before the health view runs.

    For the health-check path only, the Host is rewritten to a value
    Django accepts, leaving host validation strict for all real traffic.
    Must be placed first in MIDDLEWARE so the rewrite happens before any
    middleware calls request.get_host().
    """

    def __init__(
        self,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.path == HEALTH_CHECK_PATH:
            request.META["HTTP_HOST"] = "localhost"
        return self.get_response(request)
