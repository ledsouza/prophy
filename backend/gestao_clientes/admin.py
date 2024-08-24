from django.contrib import admin
from .models import Cliente, Unidade, Equipamento, PotencialCliente
from django.utils.translation import gettext as _

import calendar


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome_instituicao", "email_instituicao",
                    "telefone_instituicao", "endereco_instituicao")
    list_display_links = ("nome_instituicao",)
    search_fields = ("cnpj", "nome_instituicao", "user__username")


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ("nome", "cliente", "nome_contato", "email", "telefone")
    list_display_links = ("nome", "cliente")
    search_fields = ("nome", "cliente__nome_instituicao", "nome_contato")


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ("modalidade", "marca", "modelo",
                    "numero_serie", "unidade", "cliente")
    list_display_links = ("numero_serie", "unidade", "cliente")
    search_fields = ("marca", "modelo", "numero_serie", "unidade__nome")
    list_filter = ("marca", "modalidade", "unidade__cliente")

    @admin.display(description="Cliente")
    def cliente(self, obj):
        client = obj.unidade.cliente
        return client


@admin.register(PotencialCliente)
class PotencialClienteAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome", "proposal_month", "valor", "status")
    search_fields = ("cnpj", "nome", "proposal_month", "valor")
    list_filter = ("status",)
    date_hierarchy = "data_proposta"

    @admin.display(description='Mês da Proposta')
    def proposal_month(self, obj):
        month_num = obj.data_proposta.month
        return _(calendar.month_name[month_num])
