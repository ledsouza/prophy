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
from clients_management.models import Proposal, Client
from clients_management.serializers import CNPJSerializer, ClientSerializer, UnitSerializer, EquipmentSerializer
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation
from requisitions.serializers import EquipmentOperation


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
    @swagger_auto_schema(
        operation_summary="List active and accepted clients",
        operation_description="""
        Retrieve a paginated list of active and accepted clients.
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
