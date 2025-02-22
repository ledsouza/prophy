from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.models import UserAccount
from clients_management.models import Proposal, Client, Modality
from clients_management.serializers import (CNPJSerializer, ClientSerializer, UnitSerializer,
                                            EquipmentSerializer, ModalitySerializer)
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation
from requisitions.serializers import EquipmentOperation


class LatestProposalStatusView(APIView):
    """
    Check the approval status of the latest contract proposal with a given CNPJ.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Retrieve approval status of the latest contract proposal",
        operation_description="""
        This endpoint allows you to retrieve the approval status of the most recent proposal 
        associated with a specific CNPJ. It checks if the given CNPJ exists in the database 
        and retrieves the latest proposal's approval status.
        """,
        request_body=CNPJSerializer,
        responses={
            200: openapi.Response(
                description="Successful Response",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(
                            type=openapi.TYPE_BOOLEAN,
                            description="Approval status of the latest proposal"
                        )
                    }
                )
            ),
            404: openapi.Response(
                description="Proposal not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Error message indicating no proposals found"
                        )
                    }
                )
            ),
            400: openapi.Response(
                description="Invalid CNPJ format or missing data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'cnpj': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_STRING),
                            description="Validation error details for CNPJ"
                        )
                    }
                )
            )
        }
    )
    def post(self, request: Request) -> Response:
        serializer = CNPJSerializer(data=request.data)

        if serializer.is_valid():
            cnpj = serializer.validated_data['cnpj']

            try:
                latest_client = Proposal.objects.filter(
                    cnpj=cnpj
                ).latest('date')
                return Response({'status': latest_client.approved_client()}, status=status.HTTP_200_OK)

            except Proposal.DoesNotExist:
                return Response({'error': 'Nenhum cliente foi encontrado com esse cnpj.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClientStatusView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Check client status by CNPJ",
        operation_description="""
        This endpoint verifies whether a client exists in the system based on their CNPJ.
        """,
        request_body=CNPJSerializer,
        responses={
            200: openapi.Response(
                description="Status indicating if the client exists",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(
                            type=openapi.TYPE_BOOLEAN,
                            description="Indicates whether the client exists"
                        )
                    }
                )
            ),
            400: openapi.Response(
                description="Invalid CNPJ format or missing data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'cnpj': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_STRING),
                            description="Validation error details for CNPJ"
                        )
                    }
                )
            )
        }
    )
    def post(self, request: Request) -> Response:
        serializer = CNPJSerializer(data=request.data)

        if serializer.is_valid():
            cnpj = serializer.validated_data['cnpj']

            try:
                _ = Client.objects.get(cnpj=cnpj)
                return Response({'status': True}, status=status.HTTP_200_OK)
            except Client.DoesNotExist:
                return Response({'status': False}, status=status.HTTP_200_OK)


class ClientViewSet(viewsets.ViewSet):
    """
    Viewset for managing clients.

    Provides actions for listing and creating clients.
    """
    @swagger_auto_schema(
        operation_summary="List active and accepted clients",
        operation_description="""
        Retrieve a paginated list of active and accepted clients.

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
        """,
        manual_parameters=[
            openapi.Parameter(
                name="cnpj",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter clients by CNPJ."
            )
        ],
        responses={
            200: openapi.Response(
                description="Paginated list of active and accepted clients",
                schema=ClientSerializer(many=True)
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            queryset = ClientOperation.objects.all()
        else:
            queryset = ClientOperation.objects.filter(
                users=user, active=True, operation_status="A")

        cnpj = request.query_params.get('cnpj')
        if cnpj is not None:
            queryset = queryset.filter(cnpj=cnpj)

        queryset = queryset.order_by("users")

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = ClientSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = ClientSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


class UnitViewSet(viewsets.ViewSet):
    """
    Viewset for listing units.
    """

    @swagger_auto_schema(
        operation_summary="List accepted units",
        operation_description="""
        Retrieve a paginated list of accepted units.

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
        """,
        responses={
            200: openapi.Response(
                description="Paginated list of active and accepted units",
                schema=ClientSerializer(many=True)
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            queryset = UnitOperation.objects.all()
        else:
            queryset = UnitOperation.objects.filter(
                client__users=user, client__active=True, operation_status="A")

        queryset = queryset.order_by("client")

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = UnitSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = UnitSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


class EquipmentViewSet(viewsets.ViewSet):
    """
    Viewset for listing equipments.
    """

    @swagger_auto_schema(
        operation_summary="List accepted equipments",
        operation_description="""
        Retrieve a paginated list of accepted equipments.

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
        """,
        responses={
            200: openapi.Response(
                description="Paginated list of accepted equipments",
                schema=ClientSerializer(many=True)
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def list(self, request):
        user = request.user
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            queryset = EquipmentOperation.objects.all()
        else:
            queryset = EquipmentOperation.objects.filter(
                unit__client__users=user, unit__client__active=True, operation_status="A")

        queryset = queryset.order_by("unit")

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = EquipmentSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = EquipmentSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


class ModalityViewSet(viewsets.ViewSet):
    """
    A viewset for listing, creating, and destroying Modality instances.
    The list action does not use pagination as there are only a few records.
    """

    @swagger_auto_schema(
        operation_summary="List all modalities",
        operation_description="Retrieve a list of all modalities.",
        responses={
            200: openapi.Response(
                description="List of all modalities",
                schema=ModalitySerializer(many=True)
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def list(self, request):
        """
        Return a list of all modalities.
        """
        queryset = Modality.objects.all()
        serializer = ModalitySerializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="Create a new modality",
        operation_description="Create a new modality instance with the provided data.",
        request_body=ModalitySerializer,
        responses={
            201: openapi.Response(
                description="Modality created successfully",
                schema=ModalitySerializer
            ),
            400: openapi.Response(
                description="Invalid input data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Validation error details"
                        )
                    }
                )
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def create(self, request):
        """
        Create a new modality instance.
        """
        serializer = ModalitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Update a modality",
        operation_description="Update an existing modality instance with the provided data.",
        request_body=ModalitySerializer,
        responses={
            200: openapi.Response(
                description="Modality updated successfully",
                schema=ModalitySerializer
            ),
            400: openapi.Response(
                description="Invalid input data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Validation error details"
                        )
                    }
                )
            ),
            404: openapi.Response(
                description="Modality not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'detail': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Error message"
                        )
                    }
                )
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def update(self, request, pk=None):
        """
        Update an existing modality instance.
        """
        try:
            modality = Modality.objects.get(pk=pk)
        except Modality.DoesNotExist:
            return Response({"detail": "Modalidade não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ModalitySerializer(
            modality, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete a modality",
        operation_description="Delete an existing modality instance by its ID.",
        responses={
            204: openapi.Response(
                description="Modality deleted successfully"
            ),
            404: openapi.Response(
                description="Modality not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Error message"
                        )
                    }
                )
            ),
            401: "Unauthorized access",
            403: "Permission denied"
        }
    )
    def destroy(self, request, pk=None):
        """
        Delete an existing modality instance.
        """
        try:
            modality = Modality.objects.get(pk=pk)
        except Modality.DoesNotExist:
            return Response({"detail": "Modalidade não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        modality.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
