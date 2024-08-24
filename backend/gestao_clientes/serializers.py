from rest_framework import serializers


class CNPJSerializer(serializers.Serializer):
    cnpj = serializers.CharField(max_length=14)
