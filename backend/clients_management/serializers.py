from rest_framework import serializers
from clients_management.models import Client, Unit, Equipment
from users.models import UserAccount


class UserNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ["name", "role", "email", "phone"]


class CNPJSerializer(serializers.Serializer):
    cnpj = serializers.CharField(max_length=14)


class ClientSerializer(serializers.ModelSerializer):
    users = UserNameSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["users"] = [
            {"name": user["name"], "role": user["role"],
                "email": user["email"], "phone": user["phone"]}
            for user in representation["users"]
        ]
        return representation


class UnitSerializer(serializers.ModelSerializer):
    user = UserNameSerializer(read_only=True)

    class Meta:
        model = Unit
        fields = "__all__"


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = "__all__"
