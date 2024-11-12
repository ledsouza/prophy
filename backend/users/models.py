from django.db import models
from django.conf import settings
from core.validators import AlphaOnly
from users.validators import CPFValidator
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
    Group,
)


class UserAccountManager(BaseUserManager):
    def create_user(self, cpf, email, password, role="Gerente Geral do Cliente", **kwargs):
        if not cpf:
            raise ValueError("Usuários devem conter um nome de usuário.")
        if not email:
            raise ValueError('Usuários devem conter um e-mail.')
        if role not in settings.ROLES:
            raise ValueError(
                "Esse perfil de usuário não é valido. As opções são: ", settings.ROLES)

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

    def create_superuser(self, cpf, email, password, role="Gerente Prophy", **kwargs):

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
    ROLE_CHOICES = [
        ("Físico Médico Interno", "Físico Médico Interno"),
        ("Físico Médico Externo", "Físico Médico Externo"),
        ("Gerente Prophy", "Gerente Prophy"),
        ("Gerente Geral do Cliente", "Gerente Geral do Cliente"),
        ("Gerente de Unidade", "Gerente de Unidade"),
        ("Comercial", "Comercial"),
    ]

    cpf = models.CharField("CPF", max_length=11,
                           unique=True, validators=[CPFValidator()])
    email = models.EmailField("E-mail", max_length=255, unique=True)
    name = models.CharField("Nome", max_length=255, validators=[AlphaOnly()])
    role = models.CharField(
        "Perfil", max_length=30, choices=ROLE_CHOICES, default="Gerente Geral do Cliente")

    is_active = models.BooleanField(
        "Conta Ativa", default=True, help_text="Indica que o usuário será tratado como ativo. Ao invés de excluir contas de usuário, desmarque isso.")
    is_staff = models.BooleanField("Acesso à Administração", default=False,
                                   help_text="Indica que usuário consegue acessar este site de administração.")
    is_superuser = models.BooleanField(
        "Superusuário", default=False, help_text="Indica que este usuário tem todas as permissões sem atribuí-las explicitamente.")

    objects = UserAccountManager()

    USERNAME_FIELD = "cpf"
    REQUIRED_FIELDS = ["email", "name", "role"]

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
