from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from django.contrib.auth.models import AnonymousUser
from django.db import transaction

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Proposta, Cliente, Unidade, Equipamento
from .serializers import CNPJSerializer, ClienteSerializer, UnidadeSerializer, EquipamentoSerializer


class LatestPropostaStatusView(APIView):
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
            404: "Proposta not found",
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
                latest_client = Proposta.objects.filter(
                    cnpj=cnpj
                ).latest('data_proposta')
                return Response({'approved': latest_client.approved_client()}, status=status.HTTP_200_OK)

            except Proposta.DoesNotExist:
                return Response({'error': 'Nenhum cliente foi encontrado com esse cnpj'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClienteViewSet(viewsets.ViewSet):
    """
    Viewset for managing clients.

    Provides actions for listing and creating clients.
    """

    def get_permissions(self):
        """
        Get permissions based on the action being performed.

        - `list`: The request is authenticated as a user, or is a read-only request.
        - All other actions: Require authentication.
        """
        if self.action == 'list':
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        manual_parameters=[
            openapi.Parameter(
                'cnpj',
                openapi.IN_QUERY,
                description="Filter clients by CNPJ",
                type=openapi.TYPE_STRING
            )
        ],
        responses={
            200: openapi.Response(
                description="Successful Response",
                schema=ClienteSerializer(many=True)
            )
        }
    )
    def list(self, request):
        """
        List clients.

        ## Permissions:

        - Unauthenticated Users: Read-only.
        - Authenticated Gerente Geral do Cliente: List clients associated with their user data.

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
        if not isinstance(user, AnonymousUser) and user.role == "Gerente Geral do Cliente":
            queryset = Cliente.objects.filter(users=user)
        else:
            queryset = Cliente.objects.all()

        cnpj = request.query_params.get('cnpj')
        if cnpj is not None:
            queryset = queryset.filter(cnpj=cnpj)

        queryset = queryset.order_by("users")

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = ClienteSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = ClienteSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        request_body=ClienteSerializer,
        responses={
            201: openapi.Response(
                description="Client created successfully",
                schema=ClienteSerializer()
            ),
            400: "Invalid data provided"
        }
    )
    @transaction.atomic
    def create(self, request):
        """
        Create a new client.

        ## Permissions:

        - Only authenticated users.
        """
        serializer = ClienteSerializer(data=request.data)
        if serializer.is_valid():
            cliente = serializer.save()
            cliente.users.add(self.request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnidadeViewSet(viewsets.ViewSet):
    """
    Viewset for listing units.
    """

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        responses={
            200: openapi.Response(
                description="Successful Response",
                schema=UnidadeSerializer(many=True)
            )
        }
    )
    def list(self, request):
        """
        List units.

        ## Permissions:

        - Authenticated Gerente Geral do Cliente: List units associated with their user data.
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
        if user.role == "Gerente Geral do Cliente":
            queryset = Unidade.objects.filter(cliente__users=user)
        else:
            queryset = Unidade.objects.all()

        queryset = queryset.order_by("cliente")

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = UnidadeSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = UnidadeSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


class EquipamentoViewSet(viewsets.ViewSet):
    """
    Viewset for listing equipments.
    """

    @swagger_auto_schema(
        security=[{'Bearer': []}],
        responses={
            200: openapi.Response(
                description="Successful Response",
                schema=EquipamentoSerializer(many=True)
            )
        }
    )
    def list(self, request):
        """
        List equipments.

        ## Permissions:

        - Authenticated Gerente Geral do Cliente: List equipments associated with their user data.
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
        if user.role == "Gerente Geral do Cliente":
            queryset = Equipamento.objects.filter(unidade__cliente__users=user)
        else:
            queryset = Equipamento.objects.all()

        queryset = queryset.order_by("unidade")

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = EquipamentoSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = EquipamentoSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
