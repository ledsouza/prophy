from __future__ import annotations

import logging

from django.db import DatabaseError, connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Unauthenticated startup/readiness probe for Cloud Run.

    Returns 200 when the process is up and the database answers a
    trivial query; 500 when the database is unreachable.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except DatabaseError:
            logger.exception(
                "Health check failed: database unreachable"
            )
            return Response(
                {"status": "error", "database": "unreachable"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"status": "ok"}, status=status.HTTP_200_OK
        )
