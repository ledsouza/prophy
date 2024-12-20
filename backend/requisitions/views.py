from django.db import transaction
from django.core.exceptions import ValidationError
from rest_framework import viewsets
from rest_framework import status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.models import UserAccount
from requisitions.serializers import (
    ClientOperationSerializer, UnitOperationSerializer,
    UnitOperationDeleteSerializer, EquipmentOperationSerializer,
    EquipmentOperationDeleteSerializer)
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


class ClientOperationViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        operation_summary="List client operations in progress",
        operation_description="""
        Retrieve a paginated list of client operations in progress.

        ```json
        {
            "count": 123,  // Total number of clients
            "next": "http://api.example.com/clients/?page=2", // Link to next page (if available)
            "previous": null, // Link to previous page (if available)
            "results": [
                {
                    "id": 1,
                    // ... other client fields
                },
                // ... more clients on this page
            ]
        }
        ```

        - Gerente Prophy roles: All operations are retrieved.
        - Other roles: Only operations related to the authenticated user are retrieved.
        """,
        responses={
            200: openapi.Response(
                description="Paginated list of client operations",
                schema=ClientOperationSerializer(many=True)
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            queryset = ClientOperation.objects.filter(
                operation_status__in=["REV", "R"])
        else:
            queryset = ClientOperation.objects.filter(
                users=user, operation_status__in=["REV", "R"])

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
        operation_summary="Create client operation",
        request_body=ClientOperationSerializer,
        responses={
            201: openapi.Response(
                description="Client operation created successfully",
                schema=ClientOperationSerializer()
            ),
            400: openapi.Response(
                description="Invalid request body provided",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "cnpj": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING),
                            description="List of validation errors for the CNPJ field"
                        )
                    },
                    example={
                        "cnpj": [
                            "Este campo é obrigatório."
                        ]
                    }
                )
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    @transaction.atomic
    def create(self, request):
        data = request.data
        data["created_by"] = request.user.id

        serializer = ClientOperationSerializer(data=data)
        if serializer.is_valid():
            try:
                client = serializer.save()
            except ValidationError as error:
                return Response({"message": error.messages}, status=status.HTTP_400_BAD_REQUEST)

            client.users.add(self.request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Update client operation",
        operation_description="""
        Update the details of a specific client operation.

        - **Full Update**: Provide all fields in the request body. Other fields will remain unchanged.
        - **Partial Update**: Provide only the fields to be updated in the request body. Other fields will remain unchanged.

        Ensure that the client operation exists before attempting to update it.
        """,
        request_body=ClientOperationSerializer,
        responses={
            200: openapi.Response(
                description="Updated client operation",
                schema=ClientOperationSerializer()
            ),
            400: "Invalid request body provided",
            401: "Unauthorized access",
            403: "Permission denied",
            404: "Client operation not found"
        }
    )
    def update(self, request, pk=None):
        instance = ClientOperation.objects.get(pk=pk)
        serializer = ClientOperationSerializer(
            instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Delete client operation",
        operation_description="""
        Delete a specific client operation by its ID.
        """,
        responses={
            200: openapi.Response(
                description="Client operation successfully deleted",
                examples={
                    "application/json": {
                        "message": "Operação deletada com sucesso.",
                        "id": 123,
                        "operation_type": "Editar"
                    }
                }
            ),
            401: "Unauthorized access",
            403: "Permission denied",
            404: "Client operation not found"
        }
    )
    def destroy(self, request, pk=None):
        try:
            instance = ClientOperation.objects.get(pk=pk)
        except ClientOperation.DoesNotExist:
            return Response(
                {"message": "Operação não encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        instance.delete()
        return Response(
            {
                'message': 'Operação deletada com sucesso.',
                'id': instance.id,
                'operation_type': instance.get_operation_type_display()
            },
            status=status.HTTP_200_OK
        )


class UnitOperationViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        operation_summary="List unit operations in progress",
        operation_description="""
        Retrieve a paginated list of unit operations in progress.

        ```json
        {
            "count": 123,  // Total number of units
            "next": "http://api.example.com/units/?page=2", // Link to next page (if available)
            "previous": null, // Link to previous page (if available)
            "results": [
                {
                    "id": 1,
                    // ... other unit fields
                },
                // ... more units on this page
            ]
        }
        ```

        - Gerente Prophy role: All operations are retrieved.
        - Other roles: Only operations related to the authenticated user's client are retrieved.
        """,
        responses={
            200: openapi.Response(
                description="Paginated list of unit operations",
                schema=UnitOperationSerializer(many=True)
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            queryset = UnitOperation.objects.filter(
                operation_status__in=["REV", "R"])
        else:
            queryset = UnitOperation.objects.filter(
                client__users=user, operation_status__in=["REV", "R"])

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
        operation_summary="Create unit operation",
        request_body=UnitOperationSerializer,
        responses={
            201: openapi.Response(
                description="Unit operation created successfully",
                schema=UnitOperationSerializer()
            ),
            401: "Unauthorized access",
            403: "Permission denied",
            400: openapi.Response(
                description="Invalid request body provided",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "cnpj": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING),
                            description="List of validation errors for the CNPJ field"
                        )
                    },
                    example={
                        "cnpj": [
                            "Este campo é obrigatório."
                        ]
                    }
                )
            )
        }
    )
    def create(self, request):
        data = request.data
        data["created_by"] = request.user.id

        if data["operation_type"] == UnitOperation.OperationType.DELETE:
            serializer = UnitOperationDeleteSerializer(data=data)
        else:
            serializer = UnitOperationSerializer(data=data)

        if serializer.is_valid():
            try:
                serializer.save()
            except ValidationError as error:
                return Response({"message": error.messages}, status=status.HTTP_400_BAD_REQUEST)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Update unit operation",
        operation_description="""
        Update the details of a specific unit operation.

        - **Full Update**: Provide all fields in the request body. Other fields will remain unchanged.
        - **Partial Update**: Provide only the fields to be updated in the request body. Other fields will remain unchanged.

        Ensure that the client operation exists before attempting to update it.
        """,
        request_body=UnitOperationSerializer,
        responses={
            200: openapi.Response(
                description="Updated unit operation",
                schema=UnitOperationSerializer()
            ),
            400: "Invalid request body provided",
            401: "Unauthorized access",
            403: "Permission denied",
            404: "Unit operation not found"
        }
    )
    def update(self, request, pk=None):
        instance = UnitOperation.objects.get(pk=pk)
        serializer = UnitOperationSerializer(
            instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Delete unit operation",
        operation_description="""
        Delete a specific unit operation by its ID.
        """,
        responses={
            200: openapi.Response(
                description="Unit operation successfully deleted",
                examples={
                    "application/json": {
                        "message": "Operação deletada com sucesso.",
                        "id": 123,
                        "operation_type": "Editar"
                    }
                }
            ),
            401: "Unauthorized access",
            403: "Permission denied",
            404: "Unit operation not found"
        }
    )
    def destroy(self, request, pk=None):
        try:
            instance = UnitOperation.objects.get(pk=pk)
        except UnitOperation.DoesNotExist:
            return Response(
                {"message": "Operação não encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        instance.delete()
        return Response(
            {
                'message': 'Operação deletada com sucesso.',
                'id': instance.id,
                'operation_type': instance.get_operation_type_display()
            },
            status=status.HTTP_200_OK
        )


class EquipmentOperationViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        operation_summary="List equipment operations in progress",
        operation_description="""
        Retrieve a paginated list of equipment operations in progress.

        ```json
        {
            "count": 123,  // Total number of equipments
            "next": "http://api.example.com/equipments/?page=2", // Link to next page (if available)
            "previous": null, // Link to previous page (if available)
            "results": [
                {
                    "id": 1,
                    // ... other equipment fields
                },
                // ... more equipments on this page
            ]
        }
        ```

        
        - Gerente Prophy role: All operations are retrieved.
        - Other roles: Only operations related to the authenticated user's client are retrieved.
        """,
        responses={
            200: openapi.Response(
                description="Paginated list of equipment operations",
                schema=EquipmentOperationSerializer(many=True)
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            queryset = EquipmentOperation.objects.filter(
                operation_status__in=["REV", "R"])
        else:
            queryset = EquipmentOperation.objects.filter(
                unit__client__users=user, operation_status__in=["REV", "R"])

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = EquipmentOperationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = EquipmentOperationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Create equipment operation",
        request_body=EquipmentOperationSerializer,
        responses={
            201: openapi.Response(
                description="Equipment operation created successfully",
                schema=EquipmentOperationSerializer()
            ),
            401: "Unauthorized access",
            403: "Permission denied",
            400: openapi.Response(
                description="Invalid request body",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "operation_type": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING),
                            description="List of validation errors"
                        )
                    },
                    example={
                        "operation_type": [
                            "Este campo é obrigatório."
                        ]
                    }
                )
            )
        }
    )
    def create(self, request):
        data = request.data
        data["created_by"] = request.user.id

        if data["operation_type"] == EquipmentOperation.OperationType.DELETE:
            serializer = EquipmentOperationDeleteSerializer(data=data)
        else:
            serializer = EquipmentOperationSerializer(data=data)

        if serializer.is_valid():
            try:
                serializer.save()
            except ValidationError as error:
                return Response({"message": error.messages}, status=status.HTTP_400_BAD_REQUEST)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Update equipment operation",
        operation_description="""
        Update details of a specific equipment operation.

        - **Full Update**: Provide all fields in the request body. Other fields will remain unchanged.
        - **Partial Update**: Provide only the fields to be updated in the request body. Other fields will remain unchanged.

        Ensure that the client operation exists before attempting to update it.
        """,
        request_body=EquipmentOperationSerializer,
        responses={
            200: openapi.Response(
                description="Equipment operation updated successfully",
                schema=EquipmentOperationSerializer()
            ),
            400: openapi.Response(description="Invalid request body provided"),
            401: "Unauthorized access",
            403: "Permission denied",
            404: openapi.Response(description="Equipment operation not found")
        }
    )
    def update(self, request, pk=None):
        instance = EquipmentOperation.objects.get(pk=pk)
        serializer = EquipmentOperationSerializer(
            instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Delete equipment operation",
        operation_description="Delete a specific equipment operation by its ID.",
        responses={
            200: openapi.Response(
                description="Equipment operation deleted successfully",
                examples={
                    "application/json": {
                        "message": "Operação deletada com sucesso.",
                        "id": 123,
                        "operation_type": "Editar"
                    }
                }
            ),
            401: "Unauthorized access",
            403: "Permission denied",
            404: openapi.Response(description="Equipment operation not found")
        }
    )
    def destroy(self, request, pk=None):
        try:
            instance = EquipmentOperation.objects.get(pk=pk)
        except EquipmentOperation.DoesNotExist:
            return Response(
                {"message": "Operação não encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        instance.delete()
        return Response(
            {
                'message': 'Operação deletada com sucesso.',
                'id': instance.id,
                'operation_type': instance.get_operation_type_display()
            },
            status=status.HTTP_200_OK
        )
