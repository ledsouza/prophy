from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from django.db import transaction

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.models import UserAccount
from clients_management.models import Proposal, Client, Unit, Equipment
from clients_management.serializers import CNPJSerializer, ClientSerializer, UnitSerializer, EquipmentSerializer
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation, OperationStatus, OperationType
from requisitions.serializers import ClientOperationSerializer, UnitOperationSerializer, EquipmentOperation


class LatestProposalStatusView(APIView):
    """
    Check the approval status of the latest contract proposal with a given CNPJ.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        request_body=CNPJSerializer,
        responses={
            200: openapi.Response(
                description="Successful Response",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'approved': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Approval status of the latest proposal')
                    }
                )
            ),
            404: "Proposal not found",
            400: "Invalid CNPJ format or missing data"
        }
    )
    def post(self, request: Request) -> Response:
        """
        Check the approval status of the latest contract proposal.

        ## Permissions

        - All users (authenticated or not) can check.
        """
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

    def list(self, request):
        """
        List active and accepted clients.

        ## Permissions:

        - Unauthenticated Users: Read-only.
        - Authenticated Gerente Geral de Cliente: List clients associated with their user data.

        ## Pagination Format:

        **Successful Response (200 OK):**

        ```json
        {
            "count": 123,  // Total number of clients
            "next": "http://api.example.com/clients/?page=2", // Link to next page (if available)
            "previous": null, // Link to previous page (if available)
            "results": [
                {
                    "id": 1,
                    "cnpj": "12345678000190",
                    // ... other client fields
                },
                // ... more clients on this page
            ]
        }
        ```
        """
        user = request.user
        if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
            queryset = ClientOperation.objects.filter(
                users=user, active=True, operation_status="A")
        else:
            queryset = ClientOperation.objects.all()

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

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        request_body=ClientOperationSerializer,
        responses={
            201: openapi.Response(
                description="Client created successfully",
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
            )
        }
    )
    @transaction.atomic
    def create(self, request):
        """
        Create a new client.

        ## Permissions:

        - Only authenticated users.
        """
        data = request.data
        data["created_by"] = request.user.id

        serializer = ClientOperationSerializer(data=data)
        if serializer.is_valid():
            client = serializer.save()
            client.users.add(self.request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnitViewSet(viewsets.ViewSet):
    """
    Viewset for listing units.
    """

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        responses={
            200: openapi.Response(
                description="Successful Response",
                schema=UnitSerializer(many=True)
            )
        }
    )
    def list(self, request):
        """
        List accepted units.

        ## Permissions:

        - Authenticated Gerente Geral de Cliente: List units associated with their user data.
        - Other authenticated users: List all units.

        ## Pagination Format:

        **Successful Response (200 OK):**

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
        """
        user = request.user
        if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
            queryset = UnitOperation.objects.filter(
                client__users=user, client__active=True, operation_status="A")
        else:
            queryset = UnitOperation.objects.all()

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

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        request_body=UnitSerializer,
        responses={
            201: openapi.Response(
                description="Unit created successfully",
                schema=UnitSerializer()
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
            )
        }
    )
    def create(self, request):
        """
        Create a new unit.

        ## Permissions:

        - Only authenticated users.
        """
        data = request.data
        data["created_by"] = request.user.id
        serializer = UnitOperationSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EquipmentViewSet(viewsets.ViewSet):
    """
    Viewset for listing equipments.
    """

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        responses={
            200: openapi.Response(
                description="Successful Response",
                schema=EquipmentSerializer(many=True)
            )
        }
    )
    def list(self, request):
        """
        List accepted equipments.

        ## Permissions:

        - Authenticated Gerente Geral de Cliente: List equipments associated with their user data.
        - Other authenticated users: List all equipments.

        ## Response Format:

        **Successful Response (200 OK):**

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
        """
        user = request.user
        if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
            queryset = EquipmentOperation.objects.filter(
                unit__client__users=user, unit__client__active=True, operation_status="A")
        else:
            queryset = EquipmentOperation.objects.all()

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
