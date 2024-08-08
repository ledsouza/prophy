from django.core.exceptions import ValidationError
from django.contrib.auth.models import User


def custom_validation(data):
    email = data['email'].strip()
    username = data['username'].strip()
    password = data['password'].strip()

    if not email or User.objects.filter(email=email).exists():
        raise ValidationError('Esse e-mail já existe. Escolha outro e-mail.')

    if not password or len(password) < 8:
        raise ValidationError('Escolha outra senha. Mínimo 8 caracteres.')

    if not username:
        raise ValidationError('O campo de usuário é obrigatório.')
    return data


def validate_email(data):
    email = data['email'].strip()
    if not email:
        raise ValidationError('É necessário um e-mail.')
    return True


def validate_username(data):
    username = data['username'].strip()
    if not username:
        raise ValidationError('É necessário um usuário.')
    return True


def validate_password(data):
    password = data['password'].strip()
    if not password:
        raise ValidationError('É necessário uma senha.')
    return True
