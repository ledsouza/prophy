from django.contrib import admin
from .models import Cliente, Unidade, Equipamento, Proposta


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
    list_display = ("nome", "cnpj", "cliente", "nome_contato",
                    "email", "telefone", "estado", "cidade")
    list_display_links = ("nome",)
    autocomplete_fields = ("cliente",)
    search_fields = ("nome", "cnpj", "estado", "cidade")
    list_filter = ("cliente__nome_instituicao",)
    inlines = [
        EquipamentoInline,
    ]


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ("modalidade", "fabricante", "modelo",
                    "numero_serie", "unidade", "cliente")
    list_display_links = ("numero_serie",)
    autocomplete_fields = ("unidade",)
    search_fields = ("fabricante", "modelo", "numero_serie",
                     "unidade__nome", "modalidade")
    list_filter = ("fabricante", "modalidade", "unidade", "unidade__cliente")


@admin.register(Proposta)
class PropostaAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome", "proposal_month", "valor", "status")
    radio_fields = {"status": admin.HORIZONTAL}
    search_fields = ("cnpj", "nome", "valor")
    list_filter = ("status", "data_proposta")
    date_hierarchy = "data_proposta"
