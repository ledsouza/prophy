from rest_framework import serializers
from django.contrib.auth import get_user_model
import secrets

User = get_user_model()


class UnitManagerUserSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a 'Unit Manager' user.

    This serializer is used to create a user with the 'Unit Manager' role.
    The password is auto-generated using a secure token, and the user
    role is automatically set to "Gerente de Unidade".
    """
    class Meta:
        model = User
        fields = ["cpf", "name", "email"]

    def create(self, validated_data):
        """
        Creates a new user with the 'Unit Manager' role and an auto-generated password.

        Args:
            validated_data (dict): The validated data containing the fields 'cpf', 'name', and 'email'.

        Returns:
            User: A newly created User instance with the 'Unit Manager' role and a secure, randomly generated password.
        """
        user = User.objects.create_user(
            cpf=validated_data["cpf"],
            name=validated_data["name"],
            email=validated_data['email'],
            password=secrets.token_urlsafe(16),
            role="Gerente de Unidade"
        )
        return user
