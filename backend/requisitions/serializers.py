from rest_framework import serializers
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


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


class EquipmentOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentOperation
        fields = "__all__"
