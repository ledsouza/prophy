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


class Cliente(models.Model):
    """
    Model representing a client.
    """
    users = models.ManyToManyField(
        UserAccount, related_name="clientes", blank=True, verbose_name="Responsáveis")
    cnpj = models.CharField("CNPJ", max_length=14,
                            unique=True, validators=[CNPJValidator()])
    nome_instituicao = models.CharField("Nome da instituição", max_length=50)
    nome_contato = models.CharField(
        "Nome do contato", max_length=50, validators=[AlphaOnly()])
    email_contato = models.EmailField("E-mail do contato")
    email_instituicao = models.EmailField("E-mail da instituição")
    telefone_instituicao = models.CharField(
        "Telefone da instituição", max_length=13)
    endereco_instituicao = models.CharField(
        "Endereço da instituição", max_length=100)
    estado_instituicao = models.CharField(
        "Estado da instituição", max_length=2, choices=STATE_CHOICES)
    cidade_instituicao = models.CharField(
        "Cidade da instituição", max_length=50)
    status = models.CharField("Status", max_length=1, choices=(
        ("A", "Ativo"), ("I", "Inativo")), default="A")

    @admin.display(description="Responsáveis")
    def responsaveis(self):
        associated_users = self.users.all()
        associated_users = [f"<strong>{user.profile}:</strong> {
            user.name}" for user in associated_users]
        return format_html("<br>".join(associated_users))

    def __str__(self) -> str:
        return self.nome_instituicao


class Unidade(models.Model):
    """
    Model representing a unit of a client.
    """
    user = models.ForeignKey(UserAccount, on_delete=models.SET_NULL,
                             related_name="users", blank=True, null=True, verbose_name="Responsável")
    cliente = models.ForeignKey(
        Cliente, on_delete=models.SET_NULL, related_name="unidades", blank=True, null=True)
    nome = models.CharField("Nome", max_length=50)
    cnpj = models.CharField("CNPJ", max_length=14, validators=[
                            CNPJValidator()])
    nome_contato = models.CharField(
        "Nome do contato", max_length=50, validators=[AlphaOnly()])
    email = models.EmailField("E-mail")
    telefone = models.CharField("Telefone", max_length=13)
    endereco = models.CharField("Endereço", max_length=100)
    estado = models.CharField(
        "Estado", max_length=2, choices=STATE_CHOICES, blank=True)
    cidade = models.CharField("Cidade", max_length=50,
                              blank=True, validators=[AlphaOnly()])

    def __str__(self) -> str:
        return f"{self.nome} - {self.cliente.nome_instituicao}"


class Equipamento(models.Model):
    """
    Model representing equipment of a unit.
    """
    unidade = models.ForeignKey(
        Unidade, on_delete=models.SET_NULL, related_name="equipamentos", blank=True, null=True)
    modalidade = models.CharField(max_length=50)
    fabricante = models.CharField(max_length=30)
    modelo = models.CharField(max_length=30)
    numero_serie = models.CharField(
        "Número de Série", max_length=30, blank=True, null=True)
    registro_anvisa = models.CharField(
        "Registro na ANVISA", max_length=15, blank=True, null=True)
    foto_equipamento = models.ImageField(
        "Foto do equipamento", upload_to="equipamentos/fotos")
    foto_etiqueta = models.ImageField(
        "Foto da etiqueta", upload_to="equipamentos/etiquetas", blank=True, null=True)
    responsavel_manutencao = models.CharField(
        "Responsável pela manutenção", max_length=50, blank=True, null=True, validators=[AlphaOnly()])
    email_responsavel = models.EmailField(
        "E-mail do responsável pela manutenção", blank=True, null=True)
    telefone_responsavel = models.CharField(
        "Telefone do responsável pela manutenção", max_length=13, blank=True, null=True)

    @admin.display(description="Cliente")
    def cliente(self):
        client = self.unidade.cliente
        return client

    def __str__(self) -> str:
        return f"{self.fabricante} - {self.modelo} ({self.unidade.nome})"


class Proposta(models.Model):
    """
    Model representing a contract proposal with a potential client.
    """
    STATUS = (
        ("A", "Aceito"),
        ("R", "Rejeitado"),
        ("P", "Pendente"),
    )

    TIPO_CONTRATO = (
        ("A", "Anual"),
        ("M", "Mensal"),
    )

    cnpj = models.CharField("CNPJ", max_length=14, validators=[
                            CNPJValidator()])
    cidade = models.CharField("Cidade da instituição",
                              max_length=50, validators=[AlphaOnly()])
    estado = models.CharField("Estado da instituição",
                              max_length=2, choices=STATE_CHOICES)
    nome = models.CharField(
        "Nome do contato", max_length=50, validators=[AlphaOnly()])
    telefone = models.CharField("Telefone do contato", max_length=13)
    email = models.EmailField("E-mail do contato")
    data_proposta = models.DateField("Data da proposta", default=date.today)
    valor = models.DecimalField(
        "Valor proposto", max_digits=10, decimal_places=2)
    tipo_contrato = models.CharField(
        "Tipo de contrato", max_length=1, choices=TIPO_CONTRATO)
    status = models.CharField(
        max_length=1, choices=STATUS, blank=False, null=False, default="P")

    def approved_client(self):
        if self.status == "A":
            return True
        return False

    @admin.display(description='Mês da Proposta')
    def proposal_month(self):
        month_num = self.data_proposta.month
        return _(calendar.month_name[month_num])

    class Meta:
        ordering = ["-data_proposta"]

    def __str__(self) -> str:
        return f"Proposta {self.cnpj} - {self.nome}"
