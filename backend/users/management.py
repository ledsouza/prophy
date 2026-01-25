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


class IsProphyManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserAccount.Role.PROPHY_MANAGER
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
    permission_classes = [IsProphyManager]
    queryset = UserAccount.objects.all().order_by("id")
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = UserManagementFilter

    def get_serializer_class(self):
        if self.action == "create":
            return UserManagementCreateSerializer
        if self.action == "partial_update":
            return UserManagementUpdateSerializer
        return UserManagementListSerializer

    def create(self, request, *args, **kwargs):
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
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()

        output = UserManagementListSerializer(updated_user)
        return Response(output.data, status=status.HTTP_200_OK)
