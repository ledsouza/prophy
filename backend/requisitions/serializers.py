from rest_framework import serializers
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation
from clients_management.models import Unit


class ClientOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientOperation
        exclude = ["active"]


class ClientOperationUpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientOperation
        fields = ["operation_status"]


class UnitOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOperation
        fields = "__all__"


class UnitOperationUpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOperation
        fields = ["operation_status"]


class UnitOperationDeleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOperation
        fields = ["operation_type", "original_unit", "created_by", "id"]

    def create(self, validated_data):
        unit = Unit.objects.get(id=validated_data["original_unit"].id)

        unit_operation = UnitOperation.objects.create(
            operation_type=validated_data["operation_type"],
            created_by=validated_data["created_by"],
            original_unit=validated_data["original_unit"],
            client=unit.client,
            name=unit.name,
            cnpj=unit.cnpj,
            email=unit.email,
            phone=unit.phone,
            address=unit.address,
            state=unit.state,
            city=unit.city
        )

        return unit_operation


class EquipmentOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentOperation
        fields = "__all__"
