from rest_framework import serializers
from typing import Any
from django.db import transaction
from users.models import UserAccount

from clients_management.models import (
    Accessory,
    Client,
    Equipment,
    Modality,
    Proposal,
    ServiceOrder,
    Unit,
    Visit,
)


class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = "__all__"


class UserNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ["id", "cpf", "name", "role", "email", "phone"]


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
            {
                "name": user["name"],
                "role": user["role"],
                "email": user["email"],
                "phone": user["phone"],
            }
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
            "id": instance.modality.id,
            "name": instance.modality.name,
            "accessory_type": instance.modality.accessory_type,
        }

        if instance.unit:
            representation["unit_name"] = instance.unit.name

            if instance.unit.client:
                representation["client_name"] = instance.unit.client.name

        return representation


class ModalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Modality
        fields = "__all__"


class AccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Accessory
        fields = "__all__"


class ServiceOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOrder
        fields = "__all__"


class ServiceOrderCreateSerializer(serializers.ModelSerializer):
    visit = serializers.IntegerField(write_only=True, required=True)
    equipments = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Equipment.objects.all(), required=False
    )

    class Meta:
        model = ServiceOrder
        fields = ["id", "subject", "description", "conclusion", "equipments", "visit"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        visit_id = attrs.get("visit")
        equipments: list[Equipment] = attrs.get("equipments", [])

        try:
            visit = Visit.objects.get(pk=visit_id)
        except Visit.DoesNotExist:
            raise serializers.ValidationError({"visit": "Visit not found."})

        if visit.service_order_id:
            raise serializers.ValidationError("This visit already has a Service Order.")

        if equipments and visit.unit_id:
            invalid = [e.id for e in equipments if e.unit_id != visit.unit_id]
            if invalid:
                raise serializers.ValidationError(
                    {"equipments": "Equipments must belong to the visit's unit."}
                )

        attrs["visit_instance"] = visit
        return attrs

    def create(self, validated_data: dict[str, Any]) -> ServiceOrder:
        visit: Visit = validated_data.pop("visit_instance")
        validated_data.pop("visit", None)
        equipments: list[Equipment] = validated_data.pop("equipments", [])

        with transaction.atomic():
            locked_visit: Visit = Visit.objects.select_for_update().get(pk=visit.pk)

            if locked_visit.service_order_id:
                raise serializers.ValidationError(
                    "This visit already has a Service Order."
                )

            order: ServiceOrder = ServiceOrder.objects.create(**validated_data)
            if equipments:
                order.equipments.set(equipments)

            locked_visit.service_order = order
            locked_visit.status = Visit.Status.FULFILLED
            locked_visit.save(update_fields=["service_order", "status"])

            return order


class VisitSerializer(serializers.ModelSerializer):
    service_order = ServiceOrderSerializer(read_only=True)

    class Meta:
        model = Visit
        fields = "__all__"
