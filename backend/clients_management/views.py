from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import action

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from django.db.models import Q, Exists, OuterRef, Subquery

from users.models import UserAccount
from clients_management.models import Proposal, Client, Modality, Accessory
from clients_management.serializers import (
    CNPJSerializer,
    ClientSerializer,
    UnitSerializer,
    EquipmentSerializer,
    ModalitySerializer,
    AccessorySerializer,
    ProposalSerializer,
)
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


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


class ProposalViewSet(viewsets.ViewSet):
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
        return self._paginate_response(queryset, request)

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

    def _paginate_response(self, queryset, request):
        """
        Handle pagination and serialization of the queryset.
        """
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = ProposalSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = ProposalSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


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
        return self._paginate_response(queryset, request)

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

    def _paginate_response(self, queryset, request):
        """
        Handle pagination and serialization of the queryset.
        """
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
                schema=ClientSerializer(many=True),
            ),
            401: "Unauthorized access",
            403: "Permission denied",
        },
    )
    def list(self, request):
        queryset = self._get_base_queryset(request.user)
        queryset = queryset.order_by("client")
        return self._paginate_response(queryset, request)

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

    def _paginate_response(self, queryset, request):
        """
        Handle pagination and serialization of the queryset.
        """
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
        return self._paginate_response(queryset, request)

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

    def _paginate_response(self, queryset, request):
        """
        Handle pagination and serialization of the queryset.
        """
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = EquipmentSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = EquipmentSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def _get_unique_manufacturers(self, queryset):
        """
        Extract unique manufacturer names from queryset.
        """
        manufacturers = queryset.values_list("manufacturer", flat=True).distinct()
        manufacturers = [m for m in manufacturers if m]  # Filter out None/empty strings
        return sorted(manufacturers)  # Sort alphabetically


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
