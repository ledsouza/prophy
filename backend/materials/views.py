import os

from core.pagination import PaginationMixin
from django.db.models import Q, QuerySet
from django.http import FileResponse, HttpResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import UserAccount
from .models import InstitutionalMaterial
from .schemas import MaterialListQuery, SetPermissionsBody
from .serializers import (
    InstitutionalMaterialCreateSerializer,
    InstitutionalMaterialSerializer,
)


class InstitutionalMaterialViewSet(PaginationMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InstitutionalMaterialSerializer
    lookup_value_regex = r"\d+"

    def get_queryset(self) -> QuerySet[InstitutionalMaterial]:
        user: UserAccount = self.request.user
        base = InstitutionalMaterial.objects.all()

        match user.role:
            case (
                UserAccount.Role.PROPHY_MANAGER
                | UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST
            ):
                return base
            case UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST:
                return base.filter(
                    Q(visibility=InstitutionalMaterial.Visibility.PUBLIC)
                    | Q(
                        visibility=InstitutionalMaterial.Visibility.INTERNAL,
                        allowed_external_users=user,
                    )
                ).distinct()
            case _:
                return base.filter(visibility=InstitutionalMaterial.Visibility.PUBLIC)

    @swagger_auto_schema(
        operation_summary="List institutional materials",
        operation_description="Retrieve a paginated list of institutional materials with filtering support.",
        manual_parameters=[
            openapi.Parameter(
                name="visibility",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by visibility. Options: PUB (Public), INT (Internal)",
            ),
            openapi.Parameter(
                name="category",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by category code. Public categories: SIG, IOE, TER, POP, LEG, GUI, MAN, OUT. Internal categories: IOE, POP, GUI, MAN, MRE, MDO, IDV, OUT",
            ),
            openapi.Parameter(
                name="search",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Search materials by title (case-insensitive contains)",
            ),
        ],
        responses={
            200: InstitutionalMaterialSerializer(many=True),
            401: "Unauthorized",
        },
    )
    def list(self, request: Request) -> Response:
        queryset = self.get_queryset()
        params = MaterialListQuery.model_validate(
            {
                "visibility": request.query_params.get("visibility"),
                "category": request.query_params.get("category"),
                "search": request.query_params.get("search"),
            }
        )
        queryset = self._apply_filters(queryset, params)
        queryset = queryset.order_by("-created_at")
        return self._paginate_response(queryset, request, self.get_serializer_class())

    @swagger_auto_schema(
        operation_summary="Create institutional material",
        operation_description="Create a new institutional material. PROPHY_MANAGER can create Public or Internal; INTERNAL_MEDICAL_PHYSICIST may create only Public materials (no specific permissions). EXTERNAL_MEDICAL_PHYSICIST cannot create materials.",
        request_body=InstitutionalMaterialCreateSerializer,
        responses={
            201: InstitutionalMaterialSerializer,
            400: "Invalid input data",
            403: "Forbidden - insufficient role or invalid visibility for role",
        },
    )
    def create(self, request: Request) -> Response:
        role = request.user.role

        if role not in [
            UserAccount.Role.PROPHY_MANAGER,
            UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        ]:
            return Response(
                {"detail": "You do not have permission to create materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if role == UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST:
            visibility = request.data.get("visibility")
            if visibility != InstitutionalMaterial.Visibility.PUBLIC:
                return Response(
                    {
                        "detail": (
                            "Only public materials can be created by"
                            + " internal medical physicists."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = InstitutionalMaterialCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                InstitutionalMaterialSerializer(serializer.instance).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Update institutional material",
        operation_description="Update an existing institutional material. Only PROPHY_MANAGER can update materials.",
        request_body=InstitutionalMaterialCreateSerializer,
        responses={
            200: InstitutionalMaterialSerializer,
            400: "Invalid input data",
            403: "Forbidden - PROPHY_MANAGER role required",
            404: "Material not found",
        },
    )
    def update(self, request: Request, *args, **kwargs) -> Response:
        if request.user.role != UserAccount.Role.PROPHY_MANAGER:
            return Response(
                {"detail": "You do not have permission to update materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = InstitutionalMaterialCreateSerializer(
            instance, data=request.data, partial=partial
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                InstitutionalMaterialSerializer(serializer.instance).data,
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete institutional material",
        operation_description="Delete an existing institutional material. Only PROPHY_MANAGER can delete materials.",
        responses={
            204: "Material deleted successfully",
            403: "Forbidden - PROPHY_MANAGER role required",
            404: "Material not found",
        },
    )
    def destroy(self, request: Request, pk: int | None = None) -> Response:
        if request.user.role != UserAccount.Role.PROPHY_MANAGER:
            return Response(
                {"detail": "You do not have permission to delete materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            material = InstitutionalMaterial.objects.get(pk=pk)
        except InstitutionalMaterial.DoesNotExist:
            return Response(
                {"detail": "Material não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        material.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        operation_summary="Set permissions for external users",
        operation_description="Set which external medical physicists can access an internal material. Only PROPHY_MANAGER can manage permissions.",
        manual_parameters=[
            openapi.Parameter(
                name="material_id",
                in_=openapi.IN_PATH,
                type=openapi.TYPE_INTEGER,
                description="ID of the material to set permissions for",
            ),
        ],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "allowed_external_user_ids": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                    description="List of external medical physicist user IDs to grant access to",
                ),
            },
        ),
        responses={
            200: "Permissions updated successfully",
            400: "Invalid input data or material type",
            403: "Forbidden - PROPHY_MANAGER role required",
            404: "Material not found",
        },
    )
    @action(detail=True, methods=["post"])
    def set_permissions(self, request: Request, pk: int | None = None) -> Response:
        if request.user.role != UserAccount.Role.PROPHY_MANAGER:
            return Response(
                {
                    "detail": "You do not have permission to manage material permissions."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            material = self.get_object()
        except InstitutionalMaterial.DoesNotExist:
            return Response(
                {"detail": "Material não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if material.visibility != InstitutionalMaterial.Visibility.INTERNAL:
            return Response(
                {"detail": "Apenas materiais internos aceitam permissões específicas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        body = SetPermissionsBody.model_validate(request.data)
        external_users = UserAccount.objects.filter(
            id__in=body.allowed_external_user_ids,
            role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        )
        material.allowed_external_users.set(external_users)
        return Response({"status": "ok"})

    def _apply_filters(
        self,
        queryset: QuerySet[InstitutionalMaterial],
        params: MaterialListQuery,
    ) -> QuerySet[InstitutionalMaterial]:
        if params.visibility is not None:
            queryset = queryset.filter(visibility=params.visibility)

        if params.category is not None:
            queryset = queryset.filter(category=params.category)

        if params.search is not None:
            queryset = queryset.filter(title__icontains=params.search)

        return queryset


class InstitutionalMaterialDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Download institutional material file",
        operation_description="Download the file associated with an institutional material.",
        manual_parameters=[
            openapi.Parameter(
                name="material_id",
                in_=openapi.IN_PATH,
                type=openapi.TYPE_INTEGER,
                description="ID of the material to download",
            ),
        ],
        responses={
            200: "File bytes",
            403: "Forbidden - No access to this material",
            404: "Material not found",
        },
    )
    def get(self, request: Request, material_id: int) -> HttpResponse | Response:
        try:
            material = InstitutionalMaterial.objects.get(pk=material_id)
        except InstitutionalMaterial.DoesNotExist:
            return Response(
                {"detail": "Material não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user: UserAccount = request.user
        if not self._has_access(user, material):
            return Response(
                {"detail": "Você não tem permissão para acessar este material."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not material.file:
            return Response(
                {"detail": "Arquivo não disponível."},
                status=status.HTTP_404_NOT_FOUND,
            )

        _, ext = os.path.splitext(material.file.name)
        extension = ext or ".pdf"
        download_name = f"material_{material.id}{extension}"

        file_obj = material.file.open("rb")
        return FileResponse(
            file_obj,
            as_attachment=True,
            filename=download_name,
            content_type="application/octet-stream",
        )

    def _has_access(self, user: UserAccount, material: InstitutionalMaterial) -> bool:
        match (material.visibility, user.role):
            case (InstitutionalMaterial.Visibility.PUBLIC, _):
                return True
            case (
                _,
                UserAccount.Role.PROPHY_MANAGER
                | UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
            ):
                return True
            case (_, UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST):
                return material.allowed_external_users.filter(pk=user.pk).exists()
            case _:
                return False
