from rest_framework import serializers
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation
from clients_management.models import Client, Unit, Equipment


class ClientOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientOperation
        exclude = ["is_active"]

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if attrs.get("operation_type") != ClientOperation.OperationType.ADD:
            return attrs

        cnpj = attrs.get("cnpj")
        existing_client = Client.objects.filter(
            cnpj=cnpj, is_active=True
        ).exists()
        existing_operation = ClientOperation.objects.filter(
            cnpj=cnpj,
            operation_status=ClientOperation.OperationStatus.REVIEW,
        ).exists()

        if existing_client or existing_operation:
            raise serializers.ValidationError(
                {"cnpj": "Este CNPJ já está cadastrado."}
            )

        return attrs


class ClientOperationUpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientOperation
        fields = ["operation_status"]


class UnitOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOperation
        fields = "__all__"


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
            city=unit.city,
        )

        return unit_operation


class EquipmentOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentOperation
        fields = "__all__"
        extra_kwargs = {
            "equipment_photo": {"required": False},
            "label_photo": {"required": False},
        }

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is not None:
            return attrs

        operation_type = attrs.get("operation_type")
        is_edit = operation_type == EquipmentOperation.OperationType.EDIT

        if not is_edit:
            if not attrs.get("equipment_photo"):
                raise serializers.ValidationError(
                    {"equipment_photo": "Este campo é obrigatório."}
                )
            if not attrs.get("label_photo"):
                raise serializers.ValidationError(
                    {"label_photo": "Este campo é obrigatório."}
                )

        return attrs

    def create(self, validated_data):
        original_equipment = validated_data.get("original_equipment")
        if original_equipment is not None:
            if not validated_data.get("equipment_photo"):
                validated_data["equipment_photo"] = (
                    original_equipment.equipment_photo
                )
            if not validated_data.get("label_photo"):
                validated_data["label_photo"] = (
                    original_equipment.label_photo
                )
        return super().create(validated_data)

    def to_representation(self, instance: EquipmentOperation):
        representation = super().to_representation(instance)
        representation["modality"] = {
            "id": instance.modality.id,
            "name": instance.modality.name,
            "accessory_type": instance.modality.accessory_type,
        }
        return representation


class EquipmentOperationDeleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentOperation
        fields = ["operation_type", "original_equipment", "created_by", "id"]

    def create(self, validated_data):
        equipment = Equipment.objects.get(id=validated_data["original_equipment"].id)

        equipment_operation = EquipmentOperation.objects.create(
            operation_type=validated_data["operation_type"],
            created_by=validated_data["created_by"],
            original_equipment=validated_data["original_equipment"],
            unit=equipment.unit,
            modality=equipment.modality,
            manufacturer=equipment.manufacturer,
            model=equipment.model,
            series_number=equipment.series_number,
            anvisa_registry=equipment.anvisa_registry,
            equipment_photo=equipment.equipment_photo,
            label_photo=equipment.label_photo,
        )

        return equipment_operation
