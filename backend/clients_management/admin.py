from django.contrib import admin
from clients_management.models import Client, Unit, Equipment, Proposal


class UnitInline(admin.TabularInline):
    model = Unit
    fields = ["cnpj", "name", "state", "city"]


class EquipmentInline(admin.TabularInline):
    model = Equipment
    fields = ["modality", "manufacturer", "model", "series_number"]


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        "cnpj",
        "name",
        "email",
        "phone",
        "address",
        "responsables",
        "is_active",
        "status",
    )
    list_display_links = ("cnpj",)
    autocomplete_fields = ("users",)
    search_fields = ("cnpj", "name", "users__cpf")

    inlines = [
        UnitInline,
    ]


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = (
        "cnpj",
        "name",
        "client",
        "email",
        "phone",
        "state",
        "city",
        "status",
    )
    list_display_links = ("cnpj",)
    autocomplete_fields = ("client", "user")
    search_fields = ("name", "cnpj", "state", "city")
    list_filter = ("client__name",)

    inlines = [
        EquipmentInline,
    ]


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = (
        "series_number",
        "modality",
        "manufacturer",
        "model",
        "unit",
        "client",
    )
    list_display_links = ("series_number",)
    autocomplete_fields = ("unit",)
    search_fields = ("manufacturer", "model", "series_number", "unit__nome", "modality")
    list_filter = ("manufacturer", "modality", "unit", "unit__client")


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ("cnpj", "contact_name", "proposal_month", "value", "status")
    radio_fields = {"status": admin.HORIZONTAL}
    search_fields = ("cnpj", "contact_name", "value")
    list_filter = ("status", "date")
    date_hierarchy = "date"
