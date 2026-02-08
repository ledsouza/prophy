from rest_framework import serializers

from users.models import UserAccount


class ClientUserAssociationSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=UserAccount.objects.all(),
        source="user",
        write_only=True,
    )


class UnitManagerAssociationSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=UserAccount.objects.all(),
        source="user",
        allow_null=True,
        required=True,
        write_only=True,
    )
