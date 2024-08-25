from django.contrib import admin
from django.conf import settings
from .models import Cliente, Unidade, Equipamento, PotencialCliente
from django.utils.translation import gettext as _

import calendar


class UnidadeInline(admin.TabularInline):
    model = Unidade


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome_instituicao", "email_instituicao",
                    "telefone_instituicao", "endereco_instituicao")
    list_display_links = ("nome_instituicao",)
    autocomplete_fields = ("user",)
    search_fields = ("cnpj", "nome_instituicao", "user__username")
    inlines = [
        UnidadeInline,
    ]


class EquipamentoInline(admin.TabularInline):
    model = Equipamento


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ("nome", "cliente", "nome_contato", "email", "telefone")
    list_display_links = ("nome",)
    autocomplete_fields = ("cliente",)
    search_fields = ("nome", "cliente__nome_instituicao", "nome_contato")
    inlines = [
        EquipamentoInline,
    ]


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ("modalidade", "marca", "modelo",
                    "numero_serie", "unidade", "cliente")
    list_display_links = ("numero_serie",)
    autocomplete_fields = ("unidade",)
    search_fields = ("marca", "modelo", "numero_serie", "unidade__nome")
    list_filter = ("marca", "modalidade", "unidade__cliente")

    @admin.display(description="Cliente")
    def cliente(self, obj):
        client = obj.unidade.cliente
        return client


@admin.register(PotencialCliente)
class PotencialClienteAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome", "proposal_month", "valor", "status")
    radio_fields = {"status": admin.HORIZONTAL}
    search_fields = ("cnpj", "nome", "proposal_month", "valor")
    list_filter = ("status",)
    date_hierarchy = "data_proposta"

    @admin.display(description='Mês da Proposta')
    def proposal_month(self, obj):
        month_num = obj.data_proposta.month
        return _(calendar.month_name[month_num])
