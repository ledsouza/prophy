from rest_framework import serializers
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


class ClientOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientOperation
        exclude = ["active"]


class UnitOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOperation
        fields = "__all__"


class EquipmentOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentOperation
        fields = "__all__"
