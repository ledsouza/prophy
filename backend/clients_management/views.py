import logging
from datetime import date, timedelta
from io import StringIO

from django.core.management import call_command
from django.db.models import Exists, OuterRef, Q, Subquery
from django.http import HttpResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from requisitions.models import ClientOperation, EquipmentOperation, UnitOperation
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from users.authentication import GoogleOIDCAuthentication
from users.models import UserAccount

from clients_management.models import (
    Accessory,
    Client,
    Equipment,
    Modality,
    Proposal,
    Report,
    ServiceOrder,
    Visit,
)
from clients_management.pdf.service_order_pdf import build_service_order_pdf
from clients_management.serializers import (
    AccessorySerializer,
    ClientSerializer,
    CNPJSerializer,
    EquipmentSerializer,
    ModalitySerializer,
    ProposalSerializer,
    ReportSerializer,
    ServiceOrderCreateSerializer,
    ServiceOrderSerializer,
    UnitSerializer,
    VisitSerializer,
)

logger = logging.getLogger(__name__)


class PaginatedViewSet(viewsets.ViewSet):
    """
    Base ViewSet providing pagination functionality with dependency injection.

    Subclasses can use the _paginate_response method by passing their
    specific serializer class, following the Dependency Injection pattern
    for flexible and reusable pagination logic.
    """

    def _paginate_response(self, queryset, request, serializer_class):
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
                        "status": openapi.Schema(
                            type=openapi.TYPE_BOOLEAN,
                            description="Approval status of the latest proposal",
                        )
                    },
                ),
            ),
            404: openapi.Response(
                description="Proposal not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Error message indicating no proposals found",
                        )
                    },
                ),
            ),
            400: openapi.Response(
                description="Invalid CNPJ format or missing data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "cnpj": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_STRING),
                            description="Validation error details for CNPJ",
                        )
                    },
                ),
            ),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = CNPJSerializer(data=request.data)

        if serializer.is_valid():
            cnpj = serializer.validated_data["cnpj"]

            try:
                latest_client = Proposal.objects.filter(cnpj=cnpj).latest("date")
                return Response(
                    {"status": latest_client.approved_client()},
                    status=status.HTTP_200_OK,
                )

            except Proposal.DoesNotExist:
                return Response(
                    {"error": "Nenhum cliente foi encontrado com esse cnpj."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProposalViewSet(PaginatedViewSet):
    """
    Viewset for managing proposals.

    Provides actions for listing proposals with CNPJ filtering capability.
    Only accessible by PROPHY_MANAGER users.
    """

    @swagger_auto_schema(
        operation_summary="List proposals with CNPJ filtering",
        operation_description="""
        Retrieve a paginated list of proposals, optionally filtered by CNPJ.
        Only accessible by PROPHY_MANAGER users.

        ```json
        {
            "count": 123,  // Total number of proposals
            "next": "http://api.example.com/proposals/?page=2", // Link to next page (if available)
            "previous": null, // Link to previous page (if available)
            "results": [
                {
                    "id": 1,
                    "cnpj": "12345678000190",
                    "contact_name": "John Doe",
                    "status": "P",
                    // ... other proposal fields
                },
                // ... more proposals on this page
            ]
        }
        ```
        """,
        manual_parameters=[
            openapi.Parameter(
                name="cnpj",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter proposals by CNPJ.",
            )
        ],
        responses={
            200: openapi.Response(
                description="Paginated list of proposals",
                schema=ProposalSerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied - PROPHY_MANAGER role required",
        },
    )
    def list(self, request):
        user: UserAccount = request.user
        if not user.role == UserAccount.Role.PROPHY_MANAGER:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self._get_base_queryset()
        queryset = self._apply_filters(queryset, request.query_params)
        return self._paginate_response(queryset, request, ProposalSerializer)

    def _get_base_queryset(self):
        """
        Get base queryset for proposals.
        """
        return Proposal.objects.all()

    def _apply_filters(self, queryset, query_params):
        """
        Apply filtering based on query parameters.
        """
        cnpj = query_params.get("cnpj")
        if cnpj is not None:
            queryset = queryset.filter(cnpj=cnpj)
        return queryset


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
                        "status": openapi.Schema(
                            type=openapi.TYPE_BOOLEAN,
                            description="Indicates whether the client exists",
                        )
                    },
                ),
            ),
            400: openapi.Response(
                description="Invalid CNPJ format or missing data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "cnpj": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_STRING),
                            description="Validation error details for CNPJ",
                        )
                    },
                ),
            ),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = CNPJSerializer(data=request.data)

        if serializer.is_valid():
            cnpj = serializer.validated_data["cnpj"]

            try:
                _ = Client.objects.get(cnpj=cnpj)
                return Response({"status": True}, status=status.HTTP_200_OK)
            except Client.DoesNotExist:
                return Response({"status": False}, status=status.HTTP_200_OK)


class ClientViewSet(PaginatedViewSet):
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
                description="Filter clients by CNPJ.",
            ),
            openapi.Parameter(
                name="name",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter clients by name (case-insensitive contains).",
            ),
            openapi.Parameter(
                name="city",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter clients by city (exact match).",
            ),
            openapi.Parameter(
                name="user_role",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter clients that have users with specific roles. Options: FMI, FME, GP, GGC, GU, C",
            ),
            openapi.Parameter(
                name="contract_type",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by contract type from most recent accepted proposal. Options: A (Annual), M (Monthly), W (Weekly)",
            ),
            openapi.Parameter(
                name="operation_status",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by operation status. Options: pending (has ongoing operations), none (no ongoing operations)",
            ),
        ],
        responses={
            200: openapi.Response(
                description="Paginated list of active and accepted clients",
                schema=ClientSerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def list(self, request):
        queryset = self._get_base_queryset(request.user)
        queryset = self._apply_filters(queryset, request.query_params)
        queryset = queryset.order_by("id")
        return self._paginate_response(queryset, request, ClientSerializer)

    def _get_base_queryset(self, user):
        """
        Get base queryset based on user role and permissions.
        """
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return ClientOperation.objects.all()
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            user_managed_unit_operations = UnitOperation.objects.filter(
                user=user,
                client__active=True,
                operation_status=UnitOperation.OperationStatus.ACCEPTED,
            )
            client_ids_from_units = user_managed_unit_operations.values_list(
                "client_id", flat=True
            ).distinct()
            return ClientOperation.objects.filter(
                pk__in=client_ids_from_units,
                active=True,
                operation_status=ClientOperation.OperationStatus.ACCEPTED,
            )
        else:
            return ClientOperation.objects.filter(
                users=user,
                active=True,
                operation_status=ClientOperation.OperationStatus.ACCEPTED,
            )

    def _apply_filters(self, queryset, query_params):
        """
        Apply filtering based on query parameters.
        """
        cnpj = query_params.get("cnpj")
        if cnpj is not None:
            queryset = queryset.filter(cnpj=cnpj)

        name = query_params.get("name")
        if name is not None:
            queryset = queryset.filter(name__icontains=name)

        city = query_params.get("city")
        if city is not None:
            queryset = queryset.filter(city__icontains=city)

        user_role = query_params.get("user_role")
        if user_role is not None:
            queryset = queryset.filter(users__role=user_role)

        contract_type = query_params.get("contract_type")
        if contract_type is not None:
            queryset = self._filter_by_contract_type(queryset, contract_type)

        operation_status = query_params.get("operation_status")
        if operation_status is not None:
            queryset = self._filter_by_operation_status(queryset, operation_status)

        return queryset

    def _filter_by_contract_type(self, queryset, contract_type):
        """
        Filter clients by contract type from most recent accepted proposal.
        """
        most_recent_proposals = Proposal.objects.filter(
            cnpj=OuterRef("cnpj"), status=Proposal.Status.ACCEPTED
        ).order_by("-date")

        clients_with_contract_type = Proposal.objects.filter(
            status=Proposal.Status.ACCEPTED,
            contract_type=contract_type,
            pk__in=Subquery(most_recent_proposals.values("pk")[:1]),
        ).values_list("cnpj", flat=True)

        return queryset.filter(cnpj__in=clients_with_contract_type)

    def _filter_by_operation_status(self, queryset, operation_status):
        """
        Filter clients by operation status (pending or none).
        """
        has_client_ops = ClientOperation.objects.filter(
            Q(cnpj=OuterRef("cnpj")) | Q(original_client__cnpj=OuterRef("cnpj")),
            operation_status=ClientOperation.OperationStatus.REVIEW,
        )

        has_unit_ops = UnitOperation.objects.filter(
            Q(client__cnpj=OuterRef("cnpj"))
            | Q(original_unit__client__cnpj=OuterRef("cnpj")),
            operation_status=UnitOperation.OperationStatus.REVIEW,
        )

        has_equipment_ops = EquipmentOperation.objects.filter(
            Q(unit__client__cnpj=OuterRef("cnpj"))
            | Q(original_equipment__unit__client__cnpj=OuterRef("cnpj")),
            operation_status=EquipmentOperation.OperationStatus.REVIEW,
        )

        if operation_status == "pending":
            return queryset.filter(
                Q(Exists(has_client_ops))
                | Q(Exists(has_unit_ops))
                | Q(Exists(has_equipment_ops))
            )
        elif operation_status == "none":
            return queryset.filter(
                ~Q(Exists(has_client_ops))
                & ~Q(Exists(has_unit_ops))
                & ~Q(Exists(has_equipment_ops))
            )
        return queryset


class UnitViewSet(PaginatedViewSet):
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
                schema=ClientSerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def list(self, request):
        queryset = self._get_base_queryset(request.user)
        queryset = queryset.order_by("client")
        return self._paginate_response(queryset, request, UnitSerializer)

    def _get_base_queryset(self, user):
        """
        Get base queryset based on user role and permissions.
        """
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return UnitOperation.objects.filter(
                operation_status=UnitOperation.OperationStatus.ACCEPTED
            )
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            return UnitOperation.objects.filter(
                user=user,
                client__active=True,
                operation_status=UnitOperation.OperationStatus.ACCEPTED,
            )
        else:
            return UnitOperation.objects.filter(
                client__users=user,
                client__active=True,
                operation_status=UnitOperation.OperationStatus.ACCEPTED,
            )


class EquipmentViewSet(PaginatedViewSet):
    """
    Viewset for listing equipments.
    """

    @swagger_auto_schema(
        operation_summary="List accepted equipments",
        operation_description="""
        Retrieve a paginated list of accepted equipments with filtering support.

        ```json
        {
            "count": 123,  // Total number of equipments
            "next": "http://api.example.com/equipments/?page=2", // Link to next page (if available)
            "previous": null, // Link to previous page (if available)
            "results": [
                {
                    "id": 1,
                    "manufacturer": "Siemens",
                    "model": "MAGNETOM",
                    "modality": {
                        "id": 1,
                        "name": "Ressonância Magnética"
                    },
                    // ... other equipment fields
                },
                // ... more equipments on this page
            ]
        }
        ```
        """,
        manual_parameters=[
            openapi.Parameter(
                name="modality",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Filter equipments by modality ID.",
            ),
            openapi.Parameter(
                name="manufacturer",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter equipments by manufacturer name (case-insensitive contains).",
            ),
            openapi.Parameter(
                name="client",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Filter equipments by client ID (through unit relationship).",
            ),
        ],
        responses={
            200: openapi.Response(
                description="Paginated list of accepted equipments",
                schema=EquipmentSerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def list(self, request):
        queryset = self._get_base_queryset(request.user)
        queryset = self._apply_filters(queryset, request.query_params)
        queryset = queryset.order_by("unit")
        return self._paginate_response(queryset, request, EquipmentSerializer)

    @action(detail=False, methods=["get"])
    @swagger_auto_schema(
        operation_summary="Get unique manufacturer names",
        operation_description="""
        Retrieve a list of unique manufacturer names from all accessible equipments.
        This endpoint is useful for populating dropdown filter options in the frontend.
        
        ```json
        {
            "manufacturers": [
                "Siemens",
                "GE Healthcare",
                "Philips",
                "Canon"
            ]
        }
        ```
        """,
        responses={
            200: openapi.Response(
                description="List of unique manufacturer names",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "manufacturers": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_STRING),
                            description="Array of unique manufacturer names",
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def manufacturers(self, request):
        queryset = self._get_base_queryset(request.user)
        manufacturers = self._get_unique_manufacturers(queryset)
        return Response({"manufacturers": manufacturers}, status=status.HTTP_200_OK)

    def _get_base_queryset(self, user: UserAccount):
        """
        Get base queryset based on user role and permissions.
        """
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return EquipmentOperation.objects.filter(
                operation_status=EquipmentOperation.OperationStatus.ACCEPTED
            )
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            return EquipmentOperation.objects.filter(
                unit__user=user,
                unit__client__active=True,
                operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
            )
        else:
            return EquipmentOperation.objects.filter(
                unit__client__users=user,
                unit__client__active=True,
                operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
            )

    def _apply_filters(self, queryset, query_params):
        """
        Apply filtering based on query parameters.
        """
        modality = query_params.get("modality")
        if modality is not None:
            queryset = queryset.filter(modality=modality)

        manufacturer = query_params.get("manufacturer")
        if manufacturer is not None:
            queryset = queryset.filter(manufacturer__icontains=manufacturer)

        client_name = query_params.get("client_name")
        if client_name is not None:
            queryset = queryset.filter(unit__client__name__icontains=client_name)

        return queryset

    def _get_unique_manufacturers(self, queryset):
        """
        Extract unique manufacturer names from queryset.
        """
        manufacturers = queryset.values_list("manufacturer", flat=True).distinct()
        manufacturers = [m for m in manufacturers if m]  # Filter out None/empty strings
        return sorted(manufacturers)  # Sort alphabetically


class VisitViewSet(PaginatedViewSet):
    """
    Viewset for managing visits.
    """

    @swagger_auto_schema(
        operation_summary="List visits",
        operation_description="""
        Retrieve a paginated list of visits with filtering support.

        ```json
        {
            "count": 123,  // Total number of visits
            "next": "http://api.example.com/visits/?page=2", // Link to next page (if available)
            "previous": null, // Link to previous page (if available)
            "results": [
                {
                    "id": 1,
                    "date": "2023-08-31T10:00:00Z",
                    "status": "P",
                    "contact_phone": "11999999999",
                    "contact_name": "João Silva",
                    "service_order": {
                        "id": 1,
                        "subject": "Manutenção preventiva",
                        // ... other service_order fields
                    },
                    "unit": {
                        "id": 1,
                        "name": "Unidade Central",
                        // ... other unit fields
                    },
                    "client_name": "Hospital São Paulo"
                },
                // ... more visits on this page
            ]
        }
        ```
        """,
        manual_parameters=[
            openapi.Parameter(
                name="unit",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Filter visits by unit ID.",
            )
        ],
        responses={
            200: openapi.Response(
                description="Paginated list of visits",
                schema=VisitSerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def list(self, request):
        queryset = self._get_base_queryset(request.user)
        queryset = self._apply_filters(queryset, request.query_params)
        queryset = queryset.order_by("-date")
        return self._paginate_response(queryset, request, VisitSerializer)

    @swagger_auto_schema(
        operation_summary="Create a new visit",
        operation_description="Create a new visit instance with the provided data.",
        request_body=VisitSerializer,
        responses={
            201: openapi.Response(
                description="Visit created successfully", schema=VisitSerializer
            ),
            400: openapi.Response(
                description="Invalid input data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Validation error details",
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def create(self, request: Request) -> Response:
        user: UserAccount = request.user
        if not self._can_create_visit(user):
            return Response(
                {"detail": "You do not have permission to create visits."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = VisitSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Update a visit",
        operation_description="Update an existing visit instance with the provided data.",
        request_body=VisitSerializer,
        responses={
            200: openapi.Response(
                description="Visit updated successfully", schema=VisitSerializer
            ),
            400: openapi.Response(
                description="Invalid input data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Validation error details",
                        )
                    },
                ),
            ),
            404: openapi.Response(
                description="Visit not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "detail": openapi.Schema(
                            type=openapi.TYPE_STRING, description="Error message"
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def update(self, request: Request, pk: int | None = None) -> Response:
        return self._update_visit(request, pk, partial=False)

    def _update_visit(
        self, request: Request, pk: int | None, *, partial: bool
    ) -> Response:
        """
        Update a visit with optional partial flag.
        Handles permissions, object lookup, access control, validation and persistence.
        """
        user: UserAccount = request.user
        if not self._can_update_visit(user):
            return Response(
                {"detail": "You do not have permission to update visits."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            visit = Visit.objects.get(pk=pk)
        except Visit.DoesNotExist:
            return Response(
                {"detail": "Visita não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._has_visit_access(user, visit):
            return Response(
                {"detail": "You do not have permission to update this visit."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()
        serializer = VisitSerializer(visit, data=data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Partially update a visit",
        operation_description="Partially update fields of an existing visit instance.",
        request_body=VisitSerializer,
        responses={
            200: openapi.Response(
                description="Visit updated successfully", schema=VisitSerializer
            ),
            400: openapi.Response(
                description="Invalid input data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Validation error details",
                        )
                    },
                ),
            ),
            404: openapi.Response(
                description="Visit not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "detail": openapi.Schema(
                            type=openapi.TYPE_STRING, description="Error message"
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def partial_update(self, request: Request, pk: int | None = None) -> Response:
        return self._update_visit(request, pk, partial=True)

    @swagger_auto_schema(
        operation_summary="Delete a visit",
        operation_description="Delete an existing visit instance by its ID.",
        responses={
            204: openapi.Response(description="Visit deleted successfully"),
            404: openapi.Response(
                description="Visit not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "detail": openapi.Schema(
                            type=openapi.TYPE_STRING, description="Error message"
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def destroy(self, request, pk=None):
        user: UserAccount = request.user
        if user.role != UserAccount.Role.PROPHY_MANAGER:
            return Response(
                {"detail": "You do not have permission to delete visits."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            visit = Visit.objects.get(pk=pk)
        except Visit.DoesNotExist:
            return Response(
                {"detail": "Visita não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        visit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _get_base_queryset(self, user: UserAccount):
        """
        Get base queryset based on user role and permissions.
        """
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return Visit.objects.all()
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            return Visit.objects.filter(unit__user=user)
        else:
            return Visit.objects.filter(unit__client__users=user)

    def _apply_filters(self, queryset, query_params):
        """
        Apply filtering based on query parameters.
        """
        unit = query_params.get("unit")
        if unit is not None:
            queryset = queryset.filter(unit=unit)
        return queryset

    def _can_create_visit(self, user: UserAccount) -> bool:
        """
        Check if user can create visits.
        """
        return user.role in [
            UserAccount.Role.PROPHY_MANAGER,
            UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        ]

    def _can_update_visit(self, user: UserAccount) -> bool:
        """
        Check if user can update visits.
        """
        return user.role in [
            UserAccount.Role.PROPHY_MANAGER,
            UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        ]

    def _has_visit_access(self, user: UserAccount, visit: Visit) -> bool:
        """
        Check if user has access to a specific visit.
        """
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return True
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            return visit.unit.user == user
        else:
            return visit.unit.client.users.filter(pk=user.pk).exists()


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
                schema=ModalitySerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
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
                description="Modality created successfully", schema=ModalitySerializer
            ),
            400: openapi.Response(
                description="Invalid input data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Validation error details",
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
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
                description="Modality updated successfully", schema=ModalitySerializer
            ),
            400: openapi.Response(
                description="Invalid input data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Validation error details",
                        )
                    },
                ),
            ),
            404: openapi.Response(
                description="Modality not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "detail": openapi.Schema(
                            type=openapi.TYPE_STRING, description="Error message"
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def update(self, request, pk=None):
        """
        Update an existing modality instance.
        """
        try:
            modality = Modality.objects.get(pk=pk)
        except Modality.DoesNotExist:
            return Response(
                {"detail": "Modalidade não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ModalitySerializer(modality, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete a modality",
        operation_description="Delete an existing modality instance by its ID.",
        responses={
            204: openapi.Response(description="Modality deleted successfully"),
            404: openapi.Response(
                description="Modality not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "message": openapi.Schema(
                            type=openapi.TYPE_STRING, description="Error message"
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def destroy(self, request, pk=None):
        """
        Delete an existing modality instance.
        """
        try:
            modality = Modality.objects.get(pk=pk)
        except Modality.DoesNotExist:
            return Response(
                {"detail": "Modalidade não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        modality.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AccessoryViewSet(viewsets.ViewSet):
    """
    A viewset for listing, creating, updating and destroying Accessory instances.
    The list action does not use pagination as there are only a few records.
    """

    @swagger_auto_schema(
        operation_summary="List all accessories",
        operation_description="Retrieve a list of all accessories.",
        responses={
            200: openapi.Response(
                description="List of all accessories",
                schema=AccessorySerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def list(self, request):
        """
        Return a list of all accessories.
        """
        queryset = self._get_base_queryset(request.user)
        serializer = AccessorySerializer(queryset, many=True)
        return Response(serializer.data)

    def _get_base_queryset(self, user: UserAccount):
        """
        Get base queryset based on user role and permissions.
        """
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return Accessory.objects.all()
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            units = UnitOperation.objects.filter(user=user)
            return Accessory.objects.filter(equipment__unit__in=units)
        else:
            return Accessory.objects.filter(equipment__unit__client__users=user)

    @swagger_auto_schema(
        operation_summary="Create a new accessory",
        operation_description="Create a new accessory instance with the provided data.",
        request_body=AccessorySerializer,
        responses={
            201: openapi.Response(
                description="Accessory created successfully", schema=AccessorySerializer
            ),
            400: "Invalid input data",
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def create(self, request):
        """
        Create a new accessory instance.
        """
        serializer = AccessorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Update an accessory",
        operation_description="Update an existing accessory instance with the provided data.",
        request_body=AccessorySerializer,
        responses={
            200: openapi.Response(
                description="Accessory updated successfully", schema=AccessorySerializer
            ),
            400: "Invalid input data",
            404: "Accessory not found",
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def update(self, request, pk=None):
        """
        Update an existing accessory instance.
        """
        try:
            accessory = Accessory.objects.get(pk=pk)
        except Accessory.DoesNotExist:
            return Response(
                {"detail": "Acessório não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AccessorySerializer(accessory, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete an accessory",
        operation_description="Delete an existing accessory instance by its ID.",
        responses={
            204: "Accessory deleted successfully",
            404: "Accessory not found",
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def destroy(self, request, pk=None):
        """
        Delete an existing accessory instance.
        """
        try:
            accessory = Accessory.objects.get(pk=pk)
        except Accessory.DoesNotExist:
            return Response(
                {"detail": "Acessório não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        accessory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServiceOrderViewSet(viewsets.ViewSet):
    """
    Viewset for creating Service Orders linked to a Visit.
    """

    @swagger_auto_schema(
        operation_summary="Create a new Service Order",
        operation_description="""
        Create a Service Order and link it to a Visit (one-to-one).
        """,
        request_body=ServiceOrderCreateSerializer,
        responses={
            201: openapi.Response(
                description="Service Order created",
                schema=ServiceOrderSerializer,
            ),
            400: "Invalid data",
            403: "Forbidden",
        },
    )
    def create(self, request: Request) -> Response:
        user: UserAccount = request.user
        if not self._can_create_service_order(user):
            return Response(
                {"detail": "You do not have permission to create service orders."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ServiceOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            visit: Visit = serializer.validated_data["visit_instance"]
            if not self._has_visit_access(user, visit):
                return Response(
                    {
                        "detail": """
                        You do not have permission to create this service order.
                        """
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            order = serializer.save()
            return Response(
                ServiceOrderSerializer(order).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _can_create_service_order(self, user: UserAccount) -> bool:
        return user.role in [
            UserAccount.Role.PROPHY_MANAGER,
            UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
            UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        ]

    def _has_visit_access(self, user: UserAccount, visit: Visit) -> bool:
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return True
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            return bool(visit.unit and visit.unit.user_id == user.id)
        else:
            return bool(
                visit.unit
                and visit.unit.client
                and visit.unit.client.users.filter(pk=user.pk).exists()
            )

    @swagger_auto_schema(
        operation_summary="Update a Service Order",
        operation_description="Update fields of a Service Order.",
        request_body=ServiceOrderSerializer,
        responses={
            200: openapi.Response(
                description="Service Order updated", schema=ServiceOrderSerializer
            ),
            400: "Invalid data",
            403: "Forbidden",
            404: "Not found",
        },
    )
    def update(self, request: Request, pk: int | None = None) -> Response:
        return self._update_order(request, pk, partial=False)

    @swagger_auto_schema(
        operation_summary="Partially update a Service Order",
        operation_description="Partially update fields of a Service Order.",
        request_body=ServiceOrderSerializer,
        responses={
            200: openapi.Response(
                description="Service Order updated", schema=ServiceOrderSerializer
            ),
            400: "Invalid data",
            403: "Forbidden",
            404: "Not found",
        },
    )
    def partial_update(self, request: Request, pk: int | None = None) -> Response:
        return self._update_order(request, pk, partial=True)

    def _validate_equipments(self, order: ServiceOrder, data):
        """
        Ensure equipments belong to the same unit as the order's visit.
        """
        if "equipments" not in data or not (order.visit and order.visit.unit_id):
            return None

        equipment_ids = data.get("equipments")

        # Normalize to list of ints
        if isinstance(equipment_ids, str):
            try:
                equipment_ids = [int(x) for x in equipment_ids.split(",") if x.strip()]
            except Exception:
                equipment_ids = []
        elif isinstance(equipment_ids, list):
            # Ensure ints
            try:
                equipment_ids = [int(x) for x in equipment_ids]
            except Exception:
                equipment_ids = []

        invalid_ids: list[int] = []
        unit_id = order.visit.unit_id

        if isinstance(equipment_ids, list):
            equipments_qs = Equipment.objects.filter(id__in=equipment_ids)
            found_ids = set(equipments_qs.values_list("id", flat=True))

            # check for non-existent ids
            for eid in equipment_ids:
                if eid not in found_ids:
                    invalid_ids.append(eid)

            # check wrong unit
            wrong_unit_ids = list(
                equipments_qs.exclude(unit_id=unit_id).values_list("id", flat=True)
            )
            invalid_ids.extend(wrong_unit_ids)

        if invalid_ids:
            return Response(
                {
                    "equipments": """
                    Equipments must belong to the service order visit's unit.
                    """
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    def _update_order(
        self, request: Request, pk: int | None, partial: bool
    ) -> Response:
        """
        Update a Service Order with role-aware restrictions:
          - PROPHY_MANAGER: may update any fields
          - INTERNAL/EXTERNAL_MEDICAL_PHYSICIST: may only update 'updates' field
          via PATCH; must have visit access
        """
        user: UserAccount = request.user

        try:
            order = (
                ServiceOrder.objects.select_related("visit__unit")
                .prefetch_related("equipments")
                .get(pk=pk)
            )
        except ServiceOrder.DoesNotExist:
            return Response(
                {"detail": "Ordem de Serviço não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.role == UserAccount.Role.PROPHY_MANAGER:
            data = request.data.copy()
            error_resp = self._validate_equipments(order, data)
            if error_resp:
                return error_resp

            serializer = ServiceOrderSerializer(order, data=data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if user.role in [
            UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
            UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        ]:
            allowed_keys = {"updates"}
            incoming_keys = set(request.data.keys())

            if not partial:
                return Response(
                    {"detail": "Only partial updates are allowed for this role."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not incoming_keys or not incoming_keys.issubset(allowed_keys):
                return Response(
                    {
                        "detail": """
                        Only 'updates' field can be modified by medical physicists.
                        """
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            visit = order.visit
            if not visit or not self._has_visit_access(user, visit):
                return Response(
                    {
                        "detail": """
                        You do not have permission to update this service order.
                        """
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = ServiceOrderSerializer(
                order, data={"updates": request.data.get("updates", None)}, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "You do not have permission to update service orders."},
            status=status.HTTP_403_FORBIDDEN,
        )


class ServiceOrderPDFView(APIView):
    """
    Generate and download a PDF for a Service Order.
    Permissions:
      - PROPHY_MANAGER
      - Unit Manager of the service order's unit
      - Any user associated with the client (Client.users)
    """

    @swagger_auto_schema(
        operation_summary="Download Service Order PDF",
        manual_parameters=[
            openapi.Parameter(
                name="order_id",
                in_=openapi.IN_PATH,
                type=openapi.TYPE_INTEGER,
                description="ID da Ordem de Serviço",
            )
        ],
        responses={200: "PDF bytes", 403: "Forbidden", 404: "Not found"},
    )
    def get(self, request: Request, order_id: int):
        try:
            order = (
                ServiceOrder.objects.select_related("visit__unit__client")
                .prefetch_related("equipments")
                .get(pk=order_id)
            )
        except ServiceOrder.DoesNotExist:
            return Response(
                {"detail": f'ServiceOrder with ID "{order_id}" does not exist.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user: UserAccount = request.user
        allowed = False
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            allowed = True
        else:
            visit = order.visit
            unit = visit.unit
            if unit and unit.user_id == user.id:
                allowed = True
            elif unit and unit.client and unit.client.users.filter(pk=user.pk).exists():
                allowed = True

        if not allowed:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pdf_bytes = build_service_order_pdf(order)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="service_order_{order.id}.pdf"'
        )
        return response


class ReportViewSet(PaginatedViewSet):
    """
    Viewset for managing reports.
    """

    @swagger_auto_schema(
        operation_summary="List reports",
        operation_description="""
        Retrieve a paginated list of reports with filtering support.

        ```json
        {
            "count": 123,
            "next": "http://api.example.com/reports/?page=2",
            "previous": null,
            "results": [
                {
                    "id": 1,
                    "completion_date": "2024-01-15",
                    "due_date": "2025-01-15",
                    "file": "/media/reports/report.pdf",
                    "unit": 1,
                    "unit_name": "Unidade Central",
                    "client_name": "Hospital São Paulo",
                    "equipment": null,
                    "report_type": "CQ"
                }
            ]
        }
        ```
        """,
        manual_parameters=[
            openapi.Parameter(
                name="unit",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Filter reports by unit ID.",
            ),
            openapi.Parameter(
                name="equipment",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Filter reports by equipment ID.",
            ),
            openapi.Parameter(
                name="report_type",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter reports by type.",
            ),
            openapi.Parameter(
                name="due_soon",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description="Filter reports due within 30 days.",
            ),
        ],
        responses={
            200: openapi.Response(
                description="Paginated list of reports",
                schema=ReportSerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def list(self, request):
        queryset = self._get_base_queryset(request.user)
        queryset = self._apply_filters(queryset, request.query_params)
        queryset = queryset.order_by("-completion_date")
        return self._paginate_response(queryset, request, ReportSerializer)

    @swagger_auto_schema(
        operation_summary="Retrieve a single report",
        operation_description="Get details of a specific report by ID.",
        responses={
            200: openapi.Response(
                description="Report details", schema=ReportSerializer
            ),
            404: openapi.Response(
                description="Report not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "detail": openapi.Schema(
                            type=openapi.TYPE_STRING, description="Error message"
                        )
                    },
                ),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def retrieve(self, request, pk=None):
        user: UserAccount = request.user

        try:
            report = Report.objects.select_related(
                "unit__client", "equipment__unit__client"
            ).get(pk=pk)
        except Report.DoesNotExist:
            return Response(
                {"detail": "Relatório não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._has_report_access(user, report):
            return Response(
                {"detail": "You do not have permission to access this report."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Update report file",
        operation_description="""
        Update the file of an existing report.
        Only PROPHY_MANAGER and medical physicists can update reports.
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "file": openapi.Schema(
                    type=openapi.TYPE_FILE, description="New report file (PDF or Word)"
                )
            },
        ),
        responses={
            200: openapi.Response(
                description="Report updated successfully", schema=ReportSerializer
            ),
            400: "Invalid input data",
            404: "Report not found",
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def partial_update(self, request: Request, pk: int | None = None) -> Response:
        user: UserAccount = request.user

        if not self._can_update_report(user):
            return Response(
                {"detail": "You do not have permission to update reports."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            report = Report.objects.select_related(
                "unit__client", "equipment__unit__client"
            ).get(pk=pk)
        except Report.DoesNotExist:
            return Response(
                {"detail": "Relatório não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._has_report_access(user, report):
            return Response(
                {"detail": "You do not have permission to update this report."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReportSerializer(report, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _get_base_queryset(self, user: UserAccount):
        """
        Get base queryset based on user role and permissions.
        """
        if user.role == UserAccount.Role.PROPHY_MANAGER:
            return Report.objects.all()
        elif user.role in [
            UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
            UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        ]:
            return Report.objects.all()
        elif user.role == UserAccount.Role.UNIT_MANAGER:
            return Report.objects.filter(
                Q(unit__user=user) | Q(equipment__unit__user=user)
            )
        else:
            return Report.objects.filter(
                Q(unit__client__users=user) | Q(equipment__unit__client__users=user)
            )

    def _apply_filters(self, queryset, query_params):
        """
        Apply filtering based on query parameters.
        """
        unit = query_params.get("unit")
        if unit is not None:
            queryset = queryset.filter(unit=unit)

        equipment = query_params.get("equipment")
        if equipment is not None:
            queryset = queryset.filter(equipment=equipment)

        report_type = query_params.get("report_type")
        if report_type is not None:
            queryset = queryset.filter(report_type=report_type)

        due_soon = query_params.get("due_soon")
        if due_soon is not None and due_soon.lower() == "true":
            thirty_days_from_now = date.today() + timedelta(days=30)
            queryset = queryset.filter(due_date__lte=thirty_days_from_now)

        return queryset

    def _can_update_report(self, user: UserAccount) -> bool:
        """
        Check if user can update reports.
        """
        return user.role in [
            UserAccount.Role.PROPHY_MANAGER,
            UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
            UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        ]

    def _has_report_access(self, user: UserAccount, report: Report) -> bool:
        """
        Check if user has access to a specific report using structural
        pattern matching.
        """
        match user.role:
            case UserAccount.Role.PROPHY_MANAGER:
                return True

            case (
                UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST
                | UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST
            ):
                return True

            case UserAccount.Role.UNIT_MANAGER:
                return (report.unit and report.unit.user == user) or (
                    report.equipment and report.equipment.unit.user == user
                )

            case _:
                # Default case for CLIENT and other roles
                return (
                    report.unit and report.unit.client.users.filter(pk=user.pk).exists()
                ) or (
                    report.equipment
                    and report.equipment.unit.client.users.filter(pk=user.pk).exists()
                )


class ReportFileDownloadView(APIView):
    """
    Download a report file with authentication.

    Returns the file with proper Content-Disposition header to preserve
    the original filename.
    Permissions: Same as ReportViewSet._has_report_access
    """

    @swagger_auto_schema(
        operation_summary="Download Report File",
        manual_parameters=[
            openapi.Parameter(
                name="report_id",
                in_=openapi.IN_PATH,
                type=openapi.TYPE_INTEGER,
                description="ID do Relatório",
            )
        ],
        responses={
            200: "File bytes",
            403: "Forbidden",
            404: "Not found",
        },
    )
    def get(self, request: Request, report_id: int):
        try:
            report = Report.objects.select_related(
                "unit__client", "equipment__unit__client"
            ).get(pk=report_id)
        except Report.DoesNotExist:
            return Response(
                {"detail": f'Report with ID "{report_id}" does not exist.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user: UserAccount = request.user
        viewset = ReportViewSet()
        if not viewset._has_report_access(user, report):
            return Response(
                {
                    "detail": """
                    You do not have permission to download this report.
                    """
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not report.file:
            return Response(
                {"detail": "Report has no file attached."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            file_handle = report.file.open("rb")
            response = HttpResponse(
                file_handle, content_type="application/octet-stream"
            )

            import os

            filename = os.path.basename(report.file.name)
            response["Content-Disposition"] = f'attachment; filename="{filename}"'

            return response
        except Exception as e:
            logger.error(f"Error serving report file {report_id}: {e}")
            return Response(
                {"detail": "Error reading report file."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TriggerReportNotificationView(APIView):
    """
    A secure API view to be triggered by Google Cloud Scheduler.

    This view is protected by OIDC authentication, ensuring that only
    authenticated Google services can access it. When a valid POST
    request is received, it executes the `send_due_report_notifications`
    management command.
    """

    authentication_classes = [GoogleOIDCAuthentication]

    def post(self, request: Request, *args, **kwargs) -> Response:
        """
        Handles the POST request from Cloud Scheduler to run the command.
        """
        logger.info("Received request to trigger report notifications...")
        try:
            output = StringIO()
            call_command("send_due_report_notifications", stdout=output)
            command_output = output.getvalue()

            logger.info(
                "Command 'send_due_report_notifications' executed successfully. Output: %s",
                command_output.strip(),
            )
            return Response(
                {
                    "status": "ok",
                    "message": "send_due_report_notifications executed",
                    "output": command_output,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error(
                "An error occurred while running send_due_report_notifications command: %s",
                e,
                exc_info=True,
            )
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TriggerUpdateVisitsView(APIView):
    """
    A secure API view to be triggered by Google Cloud Scheduler.

    This view is protected by OIDC authentication, ensuring that only
    authenticated Google services can access it. When a valid POST
    request is received, it executes the `update_visits` management command.
    """

    authentication_classes = [GoogleOIDCAuthentication]

    def post(self, request: Request, *args, **kwargs) -> Response:
        """
        Handles the POST request from Cloud Scheduler to run the command.
        """
        logger.info("Received request to update visits...")
        try:
            output = StringIO()
            call_command("update_visits", stdout=output)
            command_output = output.getvalue()

            logger.info(
                "Command 'update_visits' executed successfully. Output: %s",
                command_output.strip(),
            )
            return Response(
                {
                    "status": "ok",
                    "message": "update_visits executed",
                    "output": command_output,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error(
                "An error occurred while running update_visits command: %s",
                e,
                exc_info=True,
            )
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
