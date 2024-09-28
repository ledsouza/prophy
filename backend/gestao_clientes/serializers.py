from rest_framework import serializers
from .models import Cliente, Unidade, Equipamento


class CNPJSerializer(serializers.Serializer):
    cnpj = serializers.CharField(max_length=14)


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"


class UnidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidade
        fields = "__all__"


class EquipamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipamento
        fields = "__all__"
