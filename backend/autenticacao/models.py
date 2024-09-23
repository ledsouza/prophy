from django.db import models
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
    Group,
)


class UserAccountManager(BaseUserManager):
    def create_user(self, username, email, password, profile="Cliente", **kwargs):
        valid_profiles = [
            "Gerente", "Físico Médico Interno", "Físico Médico Externo", "Cliente", "Gerente de Unidade"]
        if not username:
            raise ValueError("Usuários devem conter um nome de usuário.")
        if not email:
            raise ValueError('Usuários devem conter um e-mail.')
        if profile not in valid_profiles:
            raise ValueError(
                "Esse perfil de usuário não é valido. As opções são: ", valid_profiles)

        email = self.normalize_email(email)
        email = email.lower()

        user = self.model(
            username=username,
            email=email,
            profile=profile,
            **kwargs
        )

        user.set_password(password)
        user.save(using=self._db)

        group, _ = Group.objects.get_or_create(name=profile)
        user.groups.add(group)

        return user

    def create_superuser(self, username, email, password, profile="Gerente", **kwargs):

        user = self.create_user(
            username=username,
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
    username = models.CharField("Usuário", max_length=255, unique=True)
    email = models.EmailField("E-mail", max_length=255, unique=True)
    name = models.CharField("Nome", max_length=255)

    is_active = models.BooleanField("Conta Ativa", default=True)
    is_staff = models.BooleanField("Acesso à Administração", default=False)
    is_superuser = models.BooleanField("Superusuário", default=False)

    PROFILE_CHOICES = [
        ("Físico Médico Interno", "Físico Médico Interno"),
        ("Físico Médico Externo", "Físico Médico Externo"),
        ("Gerente", "Gerente"),
        ("Gerente de Unidade", "Gerente de Unidade"),
        ("Cliente", "Cliente"),
    ]
    profile = models.CharField(
        "Perfil", max_length=30, choices=PROFILE_CHOICES, default="Cliente")

    objects = UserAccountManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'name']

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
