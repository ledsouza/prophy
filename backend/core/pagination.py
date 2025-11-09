from django.db.models import QuerySet
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import Serializer


class PaginationMixin:
    """
    Lightweight mixin providing pagination helper via _paginate_response.
    """

    def _paginate_response(
        self,
        queryset: QuerySet,
        request: Request,
        serializer_class: type[Serializer],
    ) -> Response:
        """
        Handle pagination and serialization of the queryset.

        Args:
            queryset: The Django queryset to paginate.
            request: The HTTP request object.
            serializer_class: The serializer class to use for serialization.

        Returns:
            Response: Paginated response if pagination is applicable,
                otherwise full queryset response.
        """
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = serializer_class(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = serializer_class(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
