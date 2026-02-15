from clients_management.models import Client, Unit
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.management import IsProphyManagerOrCommercial
from users.models import UserAccount
from users.serializers_associations import (
    ClientUserAssociationSerializer,
    UnitManagerAssociationSerializer,
)


class ClientUserAssociationView(APIView):
    permission_classes = [IsProphyManagerOrCommercial]

    def _commercial_can_manage_user(self, request, user: UserAccount) -> bool:
        if request.user.role != UserAccount.Role.COMMERCIAL:
            return True
        return user.role in [
            UserAccount.Role.CLIENT_GENERAL_MANAGER,
            UserAccount.Role.UNIT_MANAGER,
        ]

    def post(self, request, client_id: int) -> Response:
        client = get_object_or_404(Client, pk=client_id)
        serializer = ClientUserAssociationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user: UserAccount = serializer.validated_data["user"]
        if not self._commercial_can_manage_user(request, user):
            return Response(
                {
                    "user_id": (
                        "Commercial users can only manage client general "
                        "manager or unit manager roles."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.role == UserAccount.Role.UNIT_MANAGER:
            return Response(
                {"user_id": "Unit manager users cannot be assigned to clients."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
            existing_manager = client.users.filter(
                role=UserAccount.Role.CLIENT_GENERAL_MANAGER
            ).first()
            if existing_manager and existing_manager.id != user.id:
                return Response(
                    {
                        "detail": (
                            "Client already has a client general manager assigned."
                        ),
                        "current_client_general_manager": {
                            "id": existing_manager.id,
                            "name": existing_manager.name,
                        },
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        if client.users.filter(id=user.id).exists():
            return Response(status=status.HTTP_204_NO_CONTENT)

        client.users.add(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, client_id: int, user_id: int) -> Response:
        client = get_object_or_404(Client, pk=client_id)
        user = get_object_or_404(UserAccount, pk=user_id)
        if not self._commercial_can_manage_user(request, user):
            return Response(
                {
                    "user_id": (
                        "Commercial users can only manage client general "
                        "manager or unit manager roles."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        client.users.remove(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnitManagerAssociationView(APIView):
    permission_classes = [IsProphyManagerOrCommercial]

    def put(self, request, unit_id: int) -> Response:
        unit = get_object_or_404(Unit, pk=unit_id)
        serializer = UnitManagerAssociationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user: UserAccount = serializer.validated_data.get("user")
        if (
            request.user.role == UserAccount.Role.COMMERCIAL
            and user
            and user.role != UserAccount.Role.UNIT_MANAGER
        ):
            return Response(
                {"user_id": ("Commercial users can only manage unit manager roles.")},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user and user.role != UserAccount.Role.UNIT_MANAGER:
            return Response(
                {"user_id": "Only unit manager users can be assigned to units."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user and unit.user_id == user.id:
            return Response(status=status.HTTP_204_NO_CONTENT)

        if user and unit.user_id and unit.user_id != user.id:
            return Response(
                {
                    "detail": "Unit already has a unit manager assigned.",
                    "current_unit_manager": {
                        "id": unit.user_id,
                        "name": unit.user.name,
                    },
                },
                status=status.HTTP_409_CONFLICT,
            )

        unit.user = user
        unit.save(update_fields=["user"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserAssociationsSummaryView(APIView):
    permission_classes = [IsProphyManagerOrCommercial]

    def get(self, request, user_id: int) -> Response:
        user = get_object_or_404(UserAccount, pk=user_id)
        if request.user.role == UserAccount.Role.COMMERCIAL and user.role not in [
            UserAccount.Role.CLIENT_GENERAL_MANAGER,
            UserAccount.Role.UNIT_MANAGER,
        ]:
            return Response(
                {
                    "detail": (
                        "Commercial users can only view client general "
                        "manager or unit manager roles."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == UserAccount.Role.UNIT_MANAGER:
            units = Unit.objects.filter(user=user).values("id", "name")
            return Response({"units": list(units)}, status=status.HTTP_200_OK)

        clients = Client.objects.filter(users=user).values("id", "name")
        return Response({"clients": list(clients)}, status=status.HTTP_200_OK)
