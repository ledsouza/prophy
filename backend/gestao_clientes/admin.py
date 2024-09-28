from django.contrib import admin
from .models import Cliente, Unidade, Equipamento, Proposta


class UnidadeInline(admin.TabularInline):
    model = Unidade
    fields = ["cnpj", "nome", "estado", "cidade"]


class EquipamentoInline(admin.TabularInline):
    model = Equipamento
    fields = ["modalidade", "fabricante", "modelo", "numero_serie"]


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome_instituicao", "email_instituicao",
                    "telefone_instituicao", "endereco_instituicao", "responsaveis")
    list_display_links = ("cnpj",)
    autocomplete_fields = ("users",)
    search_fields = ("cnpj", "nome_instituicao", "users__cpf")

    inlines = [
        UnidadeInline,
    ]


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome", "cliente", "nome_contato",
                    "email", "telefone", "estado", "cidade")
    list_display_links = ("cnpj",)
    autocomplete_fields = ("cliente",)
    search_fields = ("nome", "cnpj", "estado", "cidade")
    list_filter = ("cliente__nome_instituicao",)

    inlines = [
        EquipamentoInline,
    ]


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ("numero_serie", "modalidade", "fabricante", "modelo",
                    "unidade", "cliente")
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
