from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from users.models import UserAccount


@admin.register(UserAccount)
class UserAccountAdmin(BaseUserAdmin):
    verbose_name = "Conta de Usuário"
    verbose_name_plural = "Contas de Usuário"
    list_display = ("cpf", "name", "email", "phone",
                    "role", "is_active", "is_staff")
    list_display_links = ("cpf",)
    search_fields = ("cpf", "name", "email")
    list_filter = ("role", "is_active", "is_staff")
    ordering = ["name"]

    fieldsets = (
        (None, {"fields": ("cpf", "name", "email", "phone", "password", "role")}),
        ("Permissões", {
            "fields": (
                ("is_active", "is_staff", "is_superuser")
            ),
            "description": "Gerencie permissões extras além das permissões definidas no perfil."
        }),
    )
