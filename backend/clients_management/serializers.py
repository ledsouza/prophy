from rest_framework import serializers
from clients_management.models import (Client, Unit, Equipment, Modality,
                                       Accessory)
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

    def to_representation(self, instance: Client):
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

    def to_representation(self, instance: Equipment):
        representation = super().to_representation(instance)
        representation["modality"] = {
            "name": instance.modality.name,
            "accessory_type": instance.modality.accessory_type
        }
        return representation


class ModalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Modality
        fields = '__all__'


class AccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Accessory
        fields = '__all__'
