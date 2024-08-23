from django.contrib import admin
from .models import Cliente, Unidade, Equipamento


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "nome_instituicao", "email_instituicao",
                    "telefone_instituicao", "endereco_instituicao")
    search_fields = ("cnpj", "nome_instituicao", "user__username")


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ("nome", "cliente", "nome_contato", "email", "telefone")
    search_fields = ("nome", "cliente__nome_instituicao", "nome_contato")


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ("modalidade", "marca", "modelo", "numero_serie", "unidade")
    search_fields = ("marca", "modelo", "numero_serie", "unidade__nome")
    list_filter = ("marca", "modalidade", "unidade__cliente")
