from django.db import models
from django.db.models import TextChoices
from core.validators import AlphaOnly
from users.validators import CPFValidator, MobilePhoneValidator
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
    Group,
)


class UserAccountManager(BaseUserManager):
    def create_user(self, cpf, email, password, role=None, **kwargs):
        if not cpf:
            raise ValueError("Usuários devem conter um nome de usuário.")
        if not email:
            raise ValueError('Usuários devem conter um e-mail.')

        if role is None:
            role = UserAccount.Role.CLIENT_GENERAL_MANAGER

        if role not in UserAccount.Role.values:
            raise ValueError(
                f"Invalid user role. Valid roles are: {
                    ', '.join(UserAccount.Role.values)}"
            )

        email = self.normalize_email(email)
        email = email.lower()

        user = self.model(
            cpf=cpf,
            email=email,
            role=role,
            **kwargs
        )

        user.set_password(password)
        user.save(using=self._db)

        group, _ = Group.objects.get_or_create(name=role)
        user.groups.add(group)

        return user

    def create_superuser(self, cpf, email, password, role=None, **kwargs):

        if role is None:
            role = UserAccount.Role.PROPHY_MANAGER

        user = self.create_user(
            cpf=cpf,
            email=email,
            password=password,
            role=role,
            **kwargs
        )

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

    cpf = models.CharField("CPF", max_length=11,
                           unique=True, validators=[CPFValidator()])
    name = models.CharField("Nome", max_length=255, validators=[AlphaOnly()])
    email = models.EmailField("E-mail", max_length=255, unique=True)
    phone = models.CharField("Celular", max_length=11,
                             unique=True, null=True, validators=[MobilePhoneValidator()])
    role = models.CharField(
        "Perfil", max_length=30, choices=Role.choices, default=Role.CLIENT_GENERAL_MANAGER)

    is_active = models.BooleanField(
        "Conta Ativa", default=True, help_text="Indica que o usuário será tratado como ativo. Ao invés de excluir contas de usuário, desmarque isso.")
    is_staff = models.BooleanField("Acesso à Administração", default=False,
                                   help_text="Indica que usuário consegue acessar este site de administração.")
    is_superuser = models.BooleanField(
        "Superusuário", default=False, help_text="Indica que este usuário tem todas as permissões sem atribuí-las explicitamente.")

    objects = UserAccountManager()

    USERNAME_FIELD = "cpf"
    REQUIRED_FIELDS = ["name", "email", "phone", "role"]

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
