from typing import Any

from django.db import transaction
from rest_framework import serializers
from users.models import UserAccount

from clients_management.models import (
    Accessory,
    Appointment,
    Client,
    Equipment,
    Modality,
    Proposal,
    Report,
    ServiceOrder,
    Unit,
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
        fields = [
            "id",
            "cnpj",
            "name",
            "email",
            "phone",
            "address",
            "state",
            "city",
            "is_active",
            "users",
        ]

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


class ClientListSerializer(ClientSerializer):
    needs_appointment = serializers.BooleanField(read_only=True)

    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + ["needs_appointment"]


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
    appointment = serializers.IntegerField(write_only=True, required=True)
    equipments = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Equipment.objects.all(), required=False
    )

    class Meta:
        model = ServiceOrder
        fields = [
            "id",
            "subject",
            "description",
            "conclusion",
            "equipments",
            "appointment",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        appointment_id = attrs.get("appointment")
        equipments: list[Equipment] = attrs.get("equipments", [])

        try:
            appointment = Appointment.objects.get(pk=appointment_id)
        except Appointment.DoesNotExist:
            raise serializers.ValidationError({"appointment": "Appointment not found."})

        if appointment.service_order_id:
            raise serializers.ValidationError(
                "This appointment already has a Service Order."
            )

        if equipments and appointment.unit_id:
            invalid = [e.id for e in equipments if e.unit_id != appointment.unit_id]
            if invalid:
                raise serializers.ValidationError(
                    {
                        "equipments": """
                        Equipments must belong to the appointment's unit.
                        """
                    }
                )

        attrs["appointment_instance"] = appointment
        return attrs

    def create(self, validated_data: dict[str, Any]) -> ServiceOrder:
        appointment: Appointment = validated_data.pop("appointment_instance")
        validated_data.pop("appointment", None)
        equipments: list[Equipment] = validated_data.pop("equipments", [])

        with transaction.atomic():
            locked_appointment: Appointment = (
                Appointment.objects.select_for_update().get(pk=appointment.pk)
            )

            if locked_appointment.service_order_id:
                raise serializers.ValidationError(
                    "This appointment already has a Service Order."
                )

            order: ServiceOrder = ServiceOrder.objects.create(**validated_data)
            if equipments:
                order.equipments.set(equipments)

            locked_appointment.service_order = order
            locked_appointment.status = Appointment.Status.FULFILLED
            locked_appointment.save(update_fields=["service_order", "status"])

            return order


class AppointmentSerializer(serializers.ModelSerializer):
    service_order = ServiceOrderSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = "__all__"

    def to_representation(self, instance: Appointment):
        representation = super().to_representation(instance)

        unit = getattr(instance, "unit", None)
        if unit is not None:
            representation["unit_name"] = unit.name

            client = getattr(unit, "client", None)
            if client is not None:
                representation["client_name"] = client.name

            representation["unit_full_address"] = (
                f"{unit.address} - {unit.state}, {unit.city}"
            )

        representation["type_display"] = instance.get_type_display()

        return representation


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"

    def to_representation(self, instance: Report):
        representation = super().to_representation(instance)

        if instance.unit:
            representation["unit_name"] = instance.unit.name
            if instance.unit.client:
                representation["client_name"] = instance.unit.client.name

        if instance.equipment:
            representation["equipment_name"] = str(instance.equipment)
            if instance.equipment.unit and instance.equipment.unit.client:
                representation["client_name"] = instance.equipment.unit.client.name

        return representation
