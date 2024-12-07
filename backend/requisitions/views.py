from rest_framework import viewsets
from rest_framework import status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.models import UserAccount
from requisitions.serializers import (
    ClientOperationSerializer, ClientOperationUpdateStatusSerializer,
    UnitOperationSerializer, UnitOperationUpdateStatusSerializer,
    EquipmentOperationSerializer,)
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


class ClientOperationViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        operation_summary="List Client Operations",
        operation_description="""
        Retrieve a paginated list of client operations. 

        - CLIENT_GENERAL_MANAGER role: Only operations related to the authenticated user are retrieved.
        - Other roles: All operations with status 'REV' or 'R' are retrieved.
        """,
        responses={
            200: openapi.Response(
                description="Paginated list of client operations",
                schema=ClientOperationSerializer(many=True)
            )
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
            queryset = ClientOperation.objects.filter(
                users=user, operation_status__in=["REV", "R"])
        else:
            queryset = ClientOperation.objects.filter(
                operation_status__in=["REV", "R"])

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = ClientOperationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = ClientOperationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Update Client Operation Status",
        operation_description="Update the status of a specific client operation.",
        request_body=ClientOperationUpdateStatusSerializer,
        responses={
            200: openapi.Response(
                description="Updated client operation",
                schema=ClientOperationUpdateStatusSerializer()
            ),
            400: "Invalid data provided",
            404: "Client operation not found"
        }
    )
    def update(self, request, pk=None):
        instance = ClientOperation.objects.get(pk=pk)
        serializer = ClientOperationUpdateStatusSerializer(
            instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class UnitOperationViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        operation_summary="List Unit Operations",
        operation_description="""
        Retrieve a paginated list of unit operations. 

        - CLIENT_GENERAL_MANAGER role: Only operations related to the authenticated user's client are retrieved.
        - Other roles: All operations with status 'REV' or 'R' are retrieved.
        """,
        responses={
            200: openapi.Response(
                description="Paginated list of unit operations",
                schema=UnitOperationSerializer(many=True)
            )
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
            queryset = UnitOperation.objects.filter(
                client__users=user, operation_status__in=["REV", "R"])
        else:
            queryset = UnitOperation.objects.filter(
                operation_status__in=["REV", "R"])

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = UnitOperationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = UnitOperationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Update Unit Operation Status",
        operation_description="Update the status of a specific unit operation.",
        request_body=UnitOperationUpdateStatusSerializer,
        responses={
            200: openapi.Response(
                description="Updated unit operation",
                schema=UnitOperationUpdateStatusSerializer()
            ),
            400: "Invalid data provided",
            404: "Unit operation not found"
        }
    )
    def update(self, request, pk=None):
        instance = UnitOperation.objects.get(pk=pk)
        serializer = UnitOperationUpdateStatusSerializer(
            instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class EquipmentOperationViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
            queryset = EquipmentOperation.objects.filter(
                unit__client__users=user, operation_status__in=["REV", "R"])
        else:
            queryset = EquipmentOperation.objects.filter(
                operation_status__in=["REV", "R"])

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = EquipmentOperationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = EquipmentOperationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
