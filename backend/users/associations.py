from clients_management.models import Client, Unit
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.management import IsProphyManager
from users.models import UserAccount
from users.serializers_associations import (
    ClientUserAssociationSerializer,
    UnitManagerAssociationSerializer,
)


class ClientUserAssociationView(APIView):
    permission_classes = [IsProphyManager]

    def post(self, request, client_id: int) -> Response:
        client = get_object_or_404(Client, pk=client_id)
        serializer = ClientUserAssociationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user: UserAccount = serializer.validated_data["user"]
        if user.role == UserAccount.Role.UNIT_MANAGER:
            return Response(
                {"user_id": "Unit manager users cannot be assigned to clients."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if client.users.filter(id=user.id).exists():
            return Response(status=status.HTTP_204_NO_CONTENT)

        client.users.add(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, client_id: int, user_id: int) -> Response:
        client = get_object_or_404(Client, pk=client_id)
        user = get_object_or_404(UserAccount, pk=user_id)
        client.users.remove(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnitManagerAssociationView(APIView):
    permission_classes = [IsProphyManager]

    def put(self, request, unit_id: int) -> Response:
        unit = get_object_or_404(Unit, pk=unit_id)
        serializer = UnitManagerAssociationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user: UserAccount = serializer.validated_data.get("user")
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
    permission_classes = [IsProphyManager]

    def get(self, request, user_id: int) -> Response:
        user = get_object_or_404(UserAccount, pk=user_id)

        if user.role == UserAccount.Role.UNIT_MANAGER:
            units = Unit.objects.filter(user=user).values("id", "name")
            return Response({"units": list(units)}, status=status.HTTP_200_OK)

        clients = Client.objects.filter(users=user).values("id", "name")
        return Response({"clients": list(clients)}, status=status.HTTP_200_OK)
