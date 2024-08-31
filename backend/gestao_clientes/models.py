from datetime import date
from django.db import models
from django.contrib.auth.models import User
from django.contrib import admin
from django.utils.translation import gettext as _

from localflavor.br.br_states import STATE_CHOICES
import calendar


class Cliente(models.Model):
    """
    Model representing a client.
    """
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="clientes")
    cnpj = models.CharField("CNPJ", max_length=14, unique=True)
    nome_instituicao = models.CharField("Nome da instituição", max_length=50)
    nome_contato = models.CharField("Nome do contato", max_length=50)
    email_contato = models.EmailField("E-mail do contato")
    email_instituicao = models.EmailField("E-mail da instituição")
    telefone_instituicao = models.CharField(
        "Telefone da instituição", max_length=11)
    endereco_instituicao = models.CharField(
        "Endereço da instituição", max_length=50)
    estado_instituicao = models.CharField(
        "Estado da instituição", max_length=2, choices=STATE_CHOICES)
    cidade_instituicao = models.CharField(
        "Cidade da instituição", max_length=50)
    status = models.CharField("Status", max_length=1, choices=(
        ("A", "Ativo"), ("I", "Inativo")), default="A")

    def __str__(self) -> str:
        return self.nome_instituicao


class Unidade(models.Model):
    """
    Model representing a unit of a client.
    """
    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="unidades")
    nome = models.CharField("Nome da unidade", max_length=50)
    cnpj = models.CharField("CNPJ da unidade", max_length=14, unique=True)
    nome_contato = models.CharField("Nome do contato", max_length=50)
    email = models.EmailField("E-mail da unidade")
    telefone = models.CharField("Telefone da unidade", max_length=11)
    endereco = models.CharField("Endereço da unidade", max_length=50)
    estado = models.CharField(
        "Estado da unidade", max_length=2, choices=STATE_CHOICES, blank=True)
    cidade = models.CharField("Cidade da unidade", max_length=50, blank=True)

    def __str__(self) -> str:
        return f"{self.nome} - {self.cliente.nome_instituicao}"


class Equipamento(models.Model):
    """
    Model representing equipment of a unit.
    """
    unidade = models.ForeignKey(
        Unidade, on_delete=models.CASCADE, related_name="equipamentos")
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
        "Responsável pela manutenção", max_length=50, blank=True, null=True)
    email_responsavel = models.EmailField(
        "E-mail do responsável pela manutenção", blank=True, null=True)
    telefone_responsavel = models.CharField(
        "Telefone do responsável pela manutenção", max_length=11, blank=True, null=True)

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

    cnpj = models.CharField("CNPJ", max_length=14, unique=True)
    cidade = models.CharField("Cidade da instituição", max_length=50)
    estado = models.CharField("Estado da instituição",
                              max_length=2, choices=STATE_CHOICES)
    nome = models.CharField("Nome do contato", max_length=50)
    telefone = models.CharField("Telefone do contato", max_length=11)
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
