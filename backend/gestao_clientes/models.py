from datetime import date
from django.db import models
from django.contrib.auth.models import User


class Cliente(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="clientes")
    cnpj = models.CharField("CNPJ", max_length=14, unique=True)
    nome_instituicao = models.CharField("Nome da instituição", max_length=50)
    nome_contato = models.CharField("Nome do contato", max_length=50)
    email_contato = models.EmailField("E-mail do contato")
    email_instituicao = models.EmailField("E-mail da instituição")
    telefone_instituicao = models.CharField(
        "Telefone da instituição", max_length=11)
    endereco_instituicao = models.TextField("Endereço da instituição")

    def __str__(self) -> str:
        return self.nome_instituicao


class Unidade(models.Model):
    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="unidades")
    nome = models.CharField("Nome da unidade", max_length=50)
    nome_contato = models.CharField("Nome do contato", max_length=50)
    email = models.EmailField("E-mail da unidade")
    telefone = models.CharField("Telefone da unidade", max_length=11)

    def __str__(self) -> str:
        return self.nome


class Equipamento(models.Model):
    unidade = models.ForeignKey(
        Unidade, on_delete=models.CASCADE, related_name="equipamentos")
    modalidade = models.CharField(max_length=50)
    marca = models.CharField(max_length=30)
    fabricante = models.CharField(max_length=30)
    modelo = models.CharField(max_length=30)
    numero_serie = models.CharField(
        "Número de Série", max_length=30, unique=True)
    registro_anvisa = models.CharField(
        "Registro na ANVISA", max_length=15, unique=True)
    foto_equipamento = models.ImageField(
        "Foto do equipamento", upload_to="equipamentos/fotos")
    foto_etiqueta = models.ImageField(
        "Foto da etiqueta", upload_to="equipamentos/etiquetas", blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.marca} - {self.modelo} (S/N: {self.numero_serie})"


class PotencialCliente(models.Model):
    STATUS = (
        ("A", "Aceito"),
        ("R", "Rejeitado"),
        ("P", "Pendente")
    )

    cnpj = models.CharField("CNPJ", max_length=14, unique=True)
    nome = models.CharField("Nome do contato", max_length=50)
    telefone = models.CharField("Telefone do contato", max_length=11)
    email = models.EmailField("E-mail")
    data_proposta = models.DateField("Data da proposta", default=date.today)
    valor = models.DecimalField(
        "Valor proposto", max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=1, choices=STATUS, blank=False, null=False, default="P")

    def approved_client(self):
        if self.status == "A":
            return True
        return False

    class Meta:
        ordering = ["-data_proposta"]

    def __str__(self) -> str:
        return self.nome
