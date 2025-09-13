from typing import Any, TypeVar

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    Group,
    PermissionsMixin,
)
from django.db import models
from django.db.models import TextChoices

from users.validators import CPFValidator, MobilePhoneValidator

T = TypeVar("T", bound="UserAccount")


class UserAccountManager(BaseUserManager):
    def create_user(
        self,
        email: str,
        password: str,
        **kwargs: dict[str, Any],
    ) -> "UserAccount":
        if not email:
            raise ValueError("Usuários devem conter um e-mail.")

        role = kwargs.get("role")
        if role is None:
            kwargs["role"] = UserAccount.Role.CLIENT_GENERAL_MANAGER

        if kwargs["role"] not in UserAccount.Role.values:
            raise ValueError(
                f"Perfil inválido. Perfis válidos são: {
                    ', '.join(UserAccount.Role.values)}"
            )

        if kwargs["role"] != UserAccount.Role.SERVICE_ACCOUNT:
            if not kwargs.get("cpf"):
                raise ValueError("CPF é obrigatório para este tipo de usuário.")

        email = self.normalize_email(email)
        email = email.lower()

        user = self.model(email=email, **kwargs)

        user.set_password(password)
        user.save(using=self._db)

        group, _ = Group.objects.get_or_create(name=kwargs["role"])
        user.groups.add(group)

        return user

    def create_superuser(
        self,
        email: str,
        password: str,
        **kwargs: dict[str, Any],
    ) -> "UserAccount":
        kwargs.setdefault("role", UserAccount.Role.PROPHY_MANAGER)

        user = self.create_user(email=email, password=password, **kwargs)

        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user


class UserAccount(AbstractBaseUser, PermissionsMixin):
    class Role(TextChoices):
        INTERNAL_MEDICAL_PHYSICIST = "FMI", "Físico Médico Interno"
        EXTERNAL_MEDICAL_PHYSICIST = "FME", "Físico Médico Externo"
        PROPHY_MANAGER = "GP", "Gerente Prophy"
        CLIENT_GENERAL_MANAGER = "GGC", "Gerente Geral de Cliente"
        UNIT_MANAGER = "GU", "Gerente de Unidade"
        COMMERCIAL = "C", "Comercial"
        SERVICE_ACCOUNT = "SA", "Conta de Serviço"

    email = models.EmailField("E-mail", max_length=255, unique=True)
    cpf = models.CharField(
        "CPF",
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        validators=[CPFValidator()],
    )
    name = models.CharField("Nome", max_length=255)
    phone = models.CharField(
        "Celular",
        max_length=11,
        unique=True,
        null=True,
        validators=[MobilePhoneValidator()],
    )
    role = models.CharField(
        "Perfil",
        max_length=30,
        choices=Role.choices,
        default=Role.CLIENT_GENERAL_MANAGER,
    )

    is_active = models.BooleanField(
        "Conta Ativa",
        default=True,
        help_text="Indica que o usuário será tratado como ativo. Ao invés de excluir contas de usuário, desmarque isso.",
    )
    is_staff = models.BooleanField(
        "Acesso à Administração",
        default=False,
        help_text="Indica que usuário consegue acessar este site de administração.",
    )
    is_superuser = models.BooleanField(
        "Superusuário",
        default=False,
        help_text="Indica que este usuário tem todas as permissões sem atribuí-las explicitamente.",
    )

    objects = UserAccountManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "cpf"]

    def __str__(self) -> str:
        return self.name

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
