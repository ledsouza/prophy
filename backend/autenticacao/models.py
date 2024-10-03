from django.db import models
from gestao_clientes.validators import FixedLength
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
    Group,
)


class UserAccountManager(BaseUserManager):
    def create_user(self, cpf, email, password, profile="Gerente Geral do Cliente", **kwargs):
        valid_profiles = [
            "Físico Médico Interno",
            "Físico Médico Externo",
            "Gerente Prophy",
            "Gerente Geral do Cliente",
            "Gerente de Unidade",
            "Comercial"
        ]
        if not cpf:
            raise ValueError("Usuários devem conter um nome de usuário.")
        if not email:
            raise ValueError('Usuários devem conter um e-mail.')
        if profile not in valid_profiles:
            raise ValueError(
                "Esse perfil de usuário não é valido. As opções são: ", valid_profiles)

        email = self.normalize_email(email)
        email = email.lower()

        user = self.model(
            cpf=cpf,
            email=email,
            profile=profile,
            **kwargs
        )

        user.set_password(password)
        user.save(using=self._db)

        group, _ = Group.objects.get_or_create(name=profile)
        user.groups.add(group)

        return user

    def create_superuser(self, cpf, email, password, profile="Gerente Prophy", **kwargs):

        user = self.create_user(
            cpf=cpf,
            email=email,
            password=password,
            profile=profile,
            **kwargs
        )

        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user


class UserAccount(AbstractBaseUser, PermissionsMixin):
    PROFILE_CHOICES = [
        ("Físico Médico Interno", "Físico Médico Interno"),
        ("Físico Médico Externo", "Físico Médico Externo"),
        ("Gerente Prophy", "Gerente Prophy"),
        ("Gerente Geral do Cliente", "Gerente Geral do Cliente"),
        ("Gerente de Unidade", "Gerente de Unidade"),
        ("Comercial", "Comercial"),
    ]

    cpf = models.CharField("CPF", max_length=11,
                           unique=True, validators=[FixedLength(11)])
    email = models.EmailField("E-mail", max_length=255, unique=True)
    name = models.CharField("Nome", max_length=255)
    profile = models.CharField(
        "Perfil", max_length=30, choices=PROFILE_CHOICES, default="Gerente Geral do Cliente")

    is_active = models.BooleanField("Conta Ativa", default=True)
    is_staff = models.BooleanField("Acesso à Administração", default=False)
    is_superuser = models.BooleanField("Superusuário", default=False)

    objects = UserAccountManager()

    USERNAME_FIELD = "cpf"
    REQUIRED_FIELDS = ["email", "name", "profile"]

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
