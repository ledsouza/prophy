from django.contrib import admin
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


@admin.register(ClientOperation)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("operation_type", "operation_status", "client",
                    "cnpj", "name", "email", "phone", "address", "responsables")
    list_display_links = ("cnpj",)
    autocomplete_fields = ("users",)
    search_fields = ("cnpj", "name", "users__cpf")


@admin.register(UnitOperation)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("operation_type", "operation_status", "unit",
                    "cnpj", "name", "client", "email", "phone", "state", "city")
    list_display_links = ("cnpj",)
    autocomplete_fields = ("client", "user")
    search_fields = ("name", "cnpj", "state", "city")
    list_filter = ("client__name",)


@admin.register(EquipmentOperation)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ("operation_type", "operation_status", "equipment",
                    "series_number", "modality", "manufacturer", "model", "unit", "client")
    list_display_links = ("series_number",)
    autocomplete_fields = ("unit",)
    search_fields = ("manufacturer", "model", "series_number",
                     "unit__nome", "modality")
    list_filter = ("manufacturer", "modality", "unit", "unit__client")
