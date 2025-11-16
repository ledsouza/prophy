from rest_framework import serializers

from users.models import UserAccount
from .models import InstitutionalMaterial


class InstitutionalMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionalMaterial
        fields = "__all__"

    def to_representation(self, instance: InstitutionalMaterial) -> dict[str, object]:
        representation = super().to_representation(instance)
        if instance.file:
            representation["file_name"] = instance.file.name.split("/")[-1]
        return representation


class InstitutionalMaterialCreateSerializer(serializers.ModelSerializer):
    allowed_external_users = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=UserAccount.objects.filter(
            role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST
        ),
        required=False,
    )

    class Meta:
        model = InstitutionalMaterial
        fields = [
            "title",
            "description",
            "visibility",
            "category",
            "file",
            "allowed_external_users",
        ]

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        instance = getattr(self, "instance", None)

        visibility = attrs.get("visibility", getattr(instance, "visibility", None))
        category = attrs.get("category", getattr(instance, "category", None))

        allowed_external_users = attrs.get("allowed_external_users", None)
        if allowed_external_users is None:
            if instance is not None:
                try:
                    allowed_external_users = list(instance.allowed_external_users.all())
                except Exception:
                    allowed_external_users = []
            else:
                allowed_external_users = []

        has_specific_permissions = bool(allowed_external_users)

        public_set = {c for c, _ in InstitutionalMaterial.PublicCategory.choices}
        internal_set = {c for c, _ in InstitutionalMaterial.InternalCategory.choices}

        match (visibility, has_specific_permissions):
            case (InstitutionalMaterial.Visibility.PUBLIC, True):
                raise serializers.ValidationError(
                    {
                        "allowed_external_users": (
                            "Materiais públicos não aceitam permissões específicas."
                        )
                    }
                )

            case (InstitutionalMaterial.Visibility.PUBLIC, False):
                if category not in public_set:
                    raise serializers.ValidationError(
                        {"category": "Categoria inválida para material público."}
                    )

            case (InstitutionalMaterial.Visibility.INTERNAL, _):
                if category not in internal_set:
                    raise serializers.ValidationError(
                        {"category": "Categoria inválida para material interno."}
                    )

            case _:
                raise serializers.ValidationError(
                    {"visibility": "Valor de visibilidade inválido."}
                )

        return attrs
