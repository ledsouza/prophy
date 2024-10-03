from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from .models import Proposta, Cliente, Unidade, Equipamento
from .serializers import CNPJSerializer, ClienteSerializer, UnidadeSerializer, EquipamentoSerializer


class LatestPropostaStatusView(APIView):
    """
    View to check the approval status of the latest contract proposal with a given CNPJ.

    This view allows unauthenticated access.

    ## POST Request:

    **Expected Data:**

    - `cnpj`: The CNPJ of the Proposta.

    **Response:**

    - **200 OK:** If a Proposta with the given CNPJ is found.
        - Returns a JSON object containing the 'approved' key with a boolean value
          indicating whether the latest Proposta is approved or not.
    - **404 Not Found:** If no Proposta with the given CNPJ is found.
        - Returns a JSON object with an error message.
    - **400 Bad Request:** If the provided data is invalid (e.g., invalid CNPJ format).
        - Returns a JSON object containing the validation errors.
    """
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
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
    A viewset that provides actions for listing and creating clients.

    list:
        List all clients.
        - If the request is made by an authenticated client, it will only list their own client data.
        - If the request is made by an authenticated user other than a client, or an anonymous user, it will list all clients.
        - Accepts an optional query parameter 'cnpj' to filter clients by CNPJ.

    create:
        Create a new client.
        - Only authenticated users can access this view.
        - The authenticated user will be assigned as the owner of the created client.
    """

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.

        For the 'list' action, any user (authenticated or not) is granted access.
        For all other actions, only authenticated users are granted access.
        """
        if self.action == 'list':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def list(self, request):
        """
        List all clients.
        """
        user = request.user
        if not isinstance(user, AnonymousUser) and user.profile == "Gerente Geral do Cliente":
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

    @transaction.atomic
    def create(self, request):
        """
        Create a new client. Only authenticated users can access this view.
        """
        serializer = ClienteSerializer(data=request.data)
        if serializer.is_valid():
            cliente = serializer.save()
            cliente.users.add(self.request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnidadeViewSet(viewsets.ViewSet):
    """
    A viewset that provides an action for listing units.

    list:
        List all units.
        - If the request is made by an authenticated client, it will only list the units associated with their own client data.
        - If the request is made by an authenticated user other than a client, it will list all units.
    """

    def list(self, request):
        """
        List all units.
        """
        user = request.user
        if user.profile == "Gerente Geral do Cliente":
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
    A viewset that provides an action for listing equipments.

    list:
        List all equipments.
        - If the request is made by an authenticated client, it will only list the equipments associated with their own client data.
        - If the request is made by an authenticated user other than a client, it will list all equipments.
    """

    def list(self, request):
        """
        List all equipments.
        """
        user = request.user
        if user.profile == "Gerente Geral do Cliente":
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
