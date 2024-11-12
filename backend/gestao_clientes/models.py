from datetime import date
from django.db import models
from django.contrib import admin
from django.utils.translation import gettext as _
from django.utils.html import format_html

from autenticacao.models import UserAccount
from gestao_clientes.validators import CNPJValidator
from core.validators import AlphaOnly

from localflavor.br.br_states import STATE_CHOICES
import calendar


class Client(models.Model):
    """
    Model representing a client.
    """
    users = models.ManyToManyField(
        UserAccount, related_name="clients", blank=True, verbose_name="Responsáveis")
    cnpj = models.CharField("CNPJ", max_length=14,
                            unique=True, validators=[CNPJValidator()])
    name = models.CharField("Nome da instituição", max_length=50)
    email = models.EmailField("E-mail da instituição")
    phone = models.CharField(
        "Telefone da instituição", max_length=13)
    address = models.CharField(
        "Endereço da instituição", max_length=100)
    state = models.CharField(
        "Estado da instituição", max_length=2, choices=STATE_CHOICES)
    city = models.CharField(
        "Cidade da instituição", max_length=50)
    status = models.CharField("Status", max_length=1, choices=(
        ("A", "Ativo"), ("I", "Inativo")), default="A")

    @admin.display(description="Responsáveis")
    def responsables(self):
        associated_users = self.users.all()
        associated_users = [f"<strong>{user.role}:</strong> {
            user.name}" for user in associated_users]
        return format_html("<br>".join(associated_users))

    def __str__(self) -> str:
        return self.name

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"


class Unit(models.Model):
    """
    Model representing a unit of a client.
    """
    user = models.ForeignKey(UserAccount, on_delete=models.SET_NULL,
                             related_name="users", blank=True, null=True, verbose_name="Responsável")
    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL, related_name="units", blank=True, null=True, verbose_name="Cliente")
    name = models.CharField("Nome", max_length=50)
    cnpj = models.CharField("CNPJ", max_length=14, validators=[
                            CNPJValidator()])
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefone", max_length=13)
    address = models.CharField("Endereço", max_length=100)
    state = models.CharField(
        "Estado", max_length=2, choices=STATE_CHOICES, blank=True)
    city = models.CharField("Cidade", max_length=50,
                            blank=True, validators=[AlphaOnly()])

    def __str__(self) -> str:
        return f"{self.name} - {self.client.name}"

    class Meta:
        verbose_name = "Unidade"
        verbose_name_plural = "Unidades"


class Equipment(models.Model):
    """
    Model representing equipment of a unit.
    """
    unit = models.ForeignKey(
        Unit, on_delete=models.SET_NULL, related_name="equipments", blank=True, null=True)
    modality = models.CharField("Modalidade", max_length=50)
    manufacturer = models.CharField("Fabricante", max_length=30)
    model = models.CharField("Modelo", max_length=30)
    series_number = models.CharField(
        "Número de Série", max_length=30, blank=True, null=True)
    anvisa_registry = models.CharField(
        "Registro na ANVISA", max_length=15, blank=True, null=True)
    equipment_photo = models.ImageField(
        "Foto do equipamento", upload_to="equipamentos/fotos")
    label_photo = models.ImageField(
        "Foto da etiqueta", upload_to="equipamentos/etiquetas", blank=True, null=True)
    maintenance_responsable = models.CharField(
        "Responsável pela manutenção", max_length=50, blank=True, null=True, validators=[AlphaOnly()])
    email_maintenance_responsable = models.EmailField(
        "E-mail do responsável pela manutenção", blank=True, null=True)
    phone_maintenance_responsable = models.CharField(
        "Telefone do responsável pela manutenção", max_length=13, blank=True, null=True)

    @admin.display(description="Cliente")
    def client(self):
        client = self.unit.client
        return client

    def __str__(self) -> str:
        return f"{self.manufacturer} - {self.model} ({self.unit.name})"

    class Meta:
        verbose_name = "Equipamento"
        verbose_name_plural = "Equipamentos"


class Proposal(models.Model):
    """
    Model representing a contract proposal with a potential client.
    """
    STATUS = (
        ("A", "Aceito"),
        ("R", "Rejeitado"),
        ("P", "Pendente"),
    )

    CONTRACT_TYPE = (
        ("A", "Anual"),
        ("M", "Mensal"),
    )

    cnpj = models.CharField("CNPJ", max_length=14, validators=[
                            CNPJValidator()])
    state = models.CharField("Estado da instituição",
                             max_length=2, choices=STATE_CHOICES)
    city = models.CharField("Cidade da instituição",
                            max_length=50, validators=[AlphaOnly()])
    contact_name = models.CharField(
        "Nome do contato", max_length=50, validators=[AlphaOnly()])
    contact_phone = models.CharField("Telefone do contato", max_length=13)
    email = models.EmailField("E-mail do contato")
    date = models.DateField("Data da proposta", default=date.today)
    value = models.DecimalField(
        "Valor proposto", max_digits=10, decimal_places=2)
    contract_type = models.CharField(
        "Tipo de contrato", max_length=1, choices=CONTRACT_TYPE)
    status = models.CharField(
        max_length=1, choices=STATUS, blank=False, null=False, default="P")

    def approved_client(self):
        if self.status == "A":
            return True
        return False

    @admin.display(description='Mês da Proposta')
    def proposal_month(self):
        month_num = self.date.month
        return _(calendar.month_name[month_num])

    class Meta:
        ordering = ["-date"]
        verbose_name = "Proposta"
        verbose_name_plural = "Propostas"

    def __str__(self) -> str:
        return f"Proposta {self.cnpj} - {self.contact_name}"
