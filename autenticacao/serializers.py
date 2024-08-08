from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def check_user(self, clean_data):
        user = authenticate(
            username=clean_data['username'], password=clean_data['password'])
        if not user:
            raise ValidationError('Usuário não encontrado')
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'username')
