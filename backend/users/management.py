from django.contrib.auth import get_user_model
from django.db import transaction
import logging
import smtplib

from anymail.exceptions import AnymailError
from django.core.mail import BadHeaderError
from django_filters import rest_framework as filters
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response

from users.email import ManagedUserPasswordResetEmail
from users.models import UserAccount
from users.serializers import (
    UserManagementCreateSerializer,
    UserManagementListSerializer,
    UserManagementUpdateSerializer,
)

User = get_user_model()

logger = logging.getLogger(__name__)


class IsProphyManagerOrCommercial(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                UserAccount.Role.PROPHY_MANAGER,
                UserAccount.Role.COMMERCIAL,
            ]
        )


class UserManagementFilter(filters.FilterSet):
    cpf = filters.CharFilter(field_name="cpf", lookup_expr="icontains")
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = UserAccount
        fields = ["cpf", "name"]


class UserManagementViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    commercial_edit_error = {
        "detail": "Commercial users are not allowed to edit managed users."
    }
    permission_classes = [IsProphyManagerOrCommercial]
    queryset = UserAccount.objects.all().order_by("id")
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = UserManagementFilter

    def get_serializer_class(self):
        if self.action == "create":
            return UserManagementCreateSerializer
        if self.action == "partial_update":
            return UserManagementUpdateSerializer
        return UserManagementListSerializer

    def get_queryset(self):
        user: UserAccount = self.request.user
        if user.role == UserAccount.Role.COMMERCIAL:
            return UserAccount.objects.filter(
                role__in=[
                    UserAccount.Role.CLIENT_GENERAL_MANAGER,
                    UserAccount.Role.UNIT_MANAGER,
                ]
            ).order_by("id")
        return super().get_queryset()

    def _ensure_commercial_allowed_role(self, role: str | None) -> Response | None:
        if self.request.user.role != UserAccount.Role.COMMERCIAL:
            return None
        if role not in [
            UserAccount.Role.CLIENT_GENERAL_MANAGER,
            UserAccount.Role.UNIT_MANAGER,
        ]:
            return Response(
                {
                    "detail": (
                        "Commercial users can only manage client general "
                        "manager or unit manager roles."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def create(self, request, *args, **kwargs):
        role = request.data.get("role")
        permission_response = self._ensure_commercial_allowed_role(role)
        if permission_response is not None:
            return permission_response
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()

                context = {"user": user}
                ManagedUserPasswordResetEmail(
                    self.request,
                    context,
                    template_name=ManagedUserPasswordResetEmail.template_name,
                ).send([user.email])

        except (AnymailError, BadHeaderError, smtplib.SMTPException):
            logger.exception(
                "Managed user password reset email send failed",
                extra={
                    "request_user_id": getattr(request.user, "id", None),
                    "created_user_email": request.data.get("email"),
                },
            )
            return Response(
                {
                    "detail": (
                        "Não foi possível enviar o e-mail para definir a senha. "
                        "Verifique o e-mail informado e tente novamente."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        output = UserManagementListSerializer(user)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role == UserAccount.Role.COMMERCIAL:
            return Response(
                self.commercial_edit_error,
                status=status.HTTP_403_FORBIDDEN,
            )
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()

        output = UserManagementListSerializer(updated_user)
        return Response(output.data, status=status.HTTP_200_OK)
