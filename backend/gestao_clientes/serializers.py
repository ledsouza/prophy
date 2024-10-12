from rest_framework import serializers
from gestao_clientes.models import Cliente, Unidade, Equipamento
from autenticacao.models import UserAccount


class UserNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ["name", "role"]


class CNPJSerializer(serializers.Serializer):
    cnpj = serializers.CharField(max_length=14)


class ClienteSerializer(serializers.ModelSerializer):
    users = UserNameSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['users'] = [
            {'name': user['name'], 'role': user['role']}
            for user in representation['users']
        ]
        return representation


class UnidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidade
        fields = "__all__"


class EquipamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipamento
        fields = "__all__"
