from django.contrib import admin
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


@admin.register(ClientOperation)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("operation_type", "operation_status", "created_by",
                    "cnpj", "name", "email", "phone", "address")
    list_display_links = ("cnpj",)
    autocomplete_fields = ("users",)
    search_fields = ("cnpj", "name", "users__cpf")

    fieldsets = [
        (
            None,
            {
                "fields": ["operation_type", "operation_status", "created_by", "cnpj",
                           "name", "email", "phone", "address", "state", "city", "original_client", "note"]
            }
        )
    ]
    readonly_fields = ["operation_type", "created_by", "cnpj", "name",
                       "email", "phone", "address", "state", "city", "original_client"]


@admin.register(UnitOperation)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("operation_type", "operation_status", "created_by",
                    "cnpj", "name", "client", "email", "phone", "state", "city")
    list_display_links = ("cnpj",)
    autocomplete_fields = ("client", "user")
    search_fields = ("name", "cnpj", "state", "city")
    list_filter = ("client__name",)

    fieldsets = [
        (
            None,
            {
                "fields": ["operation_type", "operation_status", "created_by", "cnpj",
                           "name", "email", "phone", "address", "state", "city", "original_unit", "note"]
            }
        )
    ]


@admin.register(EquipmentOperation)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ("operation_type", "operation_status", "created_by",
                    "series_number", "modality", "manufacturer", "model", "unit", "client")
    list_display_links = ("series_number",)
    autocomplete_fields = ("unit",)
    search_fields = ("manufacturer", "model", "series_number",
                     "modality")
    list_filter = ("manufacturer", "modality", "unit__client")

    fieldsets = [
        (
            None,
            {
                "fields": ["operation_type", "operation_status", "created_by", "modality",
                           "manufacturer", "model", "series_number", "anvisa_registry", "equipment_photo",
                           "label_photo", "original_equipment", "note"]
            }
        )
    ]
