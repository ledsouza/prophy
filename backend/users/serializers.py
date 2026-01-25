import secrets

from clients_management.models import Unit
from django.contrib.auth import get_user_model
from djoser.serializers import UserDeleteSerializer
from rest_framework import serializers

from users.models import UserAccount

User = get_user_model()


class CustomUserDeleteSerializer(UserDeleteSerializer):
    """
    Custom serializer for user deletion that doesn't require the current password.
    """

    # Remove the current_password field by setting it to None
    current_password = None

    def validate(self, attrs):
        # Skip the password validation by returning attrs directly
        return attrs


class UnitManagerUserSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a Unit Manager user.

    This serializer is used to create a user with the Unit Manager role.
    The password is auto-generated using a secure token, and the user
    role is automatically set to Unit Manager.

    The unit_id field is used to associate the user with a specific unit.
    """

    unit_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = User
        fields = ["cpf", "name", "email", "phone", "unit_id"]

    def validate_unit_id(self, value):
        """
        Validate that the unit exists.

        Args:
            value (int): The unit ID to validate.
        Returns:
            int: The validated unit ID.

        Raises:
            serializers.ValidationError: If the unit with the given ID does not exist.
        """
        try:
            Unit.objects.get(pk=value)
        except Unit.DoesNotExist:
            raise serializers.ValidationError("Unit with this ID does not exist.")
        return value

    def create(self, validated_data):
        """
        Creates a new user with the Unit Manager role and an auto-generated password,
        and associates it with the specified unit.

        Args:
            validated_data (dict): The validated data containing the fields "cpf", "name",
                                  "email", "phone", and "unit_id".

        Returns:
            User: A newly created User instance with the Unit Manager role and a secure,
                 randomly generated password, associated with the specified unit.
        """
        unit_id = validated_data.pop("unit_id")

        random_password = secrets.token_urlsafe(16)
        user = User.objects.create_user(
            cpf=validated_data["cpf"],
            name=validated_data["name"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            password=random_password,
            role=UserAccount.Role.UNIT_MANAGER,
        )

        user.set_unusable_password()
        user.save(update_fields=["password"])

        unit = Unit.objects.get(pk=unit_id)
        unit.user = user
        unit.save()

        return user


class UserManagementListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "cpf",
            "name",
            "email",
            "phone",
            "role",
            "is_active",
            "is_staff",
        ]


class UserManagementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["cpf", "name", "email", "phone", "role", "is_active"]

    def validate_role(self, value):
        if value not in UserAccount.Role.values:
            raise serializers.ValidationError("Invalid user role")
        if value == UserAccount.Role.SERVICE_ACCOUNT:
            raise serializers.ValidationError("Service account role is not allowed")
        return value

    def create(self, validated_data):
        role = validated_data.get("role")
        if role == UserAccount.Role.PROPHY_MANAGER:
            validated_data["is_staff"] = True
        else:
            validated_data["is_staff"] = False

        user = User.objects.create_user(
            cpf=validated_data["cpf"],
            name=validated_data["name"],
            email=validated_data["email"],
            phone=validated_data.get("phone"),
            password=secrets.token_urlsafe(16),
            role=validated_data["role"],
        )

        user.is_active = validated_data.get("is_active", True)
        user.is_staff = validated_data.get("is_staff", False)
        user.set_unusable_password()
        user.save(update_fields=["is_active", "is_staff", "password"])
        return user


class UserManagementUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "email", "phone", "role", "is_active"]

    def validate_role(self, value):
        if value == UserAccount.Role.SERVICE_ACCOUNT:
            raise serializers.ValidationError("Service account role is not allowed")
        return value

    def update(self, instance, validated_data):
        new_role = validated_data.get("role")
        if new_role is not None and new_role != instance.role:
            if new_role == UserAccount.Role.PROPHY_MANAGER:
                instance.is_staff = True
            else:
                instance.is_staff = False

        return super().update(instance, validated_data)
