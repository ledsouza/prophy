from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import UserAccount


@admin.register(UserAccount)
class UserAccountAdmin(BaseUserAdmin):
    verbose_name = "Conta de Usuário"
    verbose_name_plural = "Contas de Usuário"
    list_display = ("username", "email", "name",
                    "profile", "is_active", "is_staff")
    list_display_links = ("username",)
    search_fields = ("username", "name", "email")
    list_filter = ("profile", "is_active", "is_staff")

    fieldsets = (
        (None, {'fields': ('username', 'email', 'name', 'password', 'profile')}),
        ('Permissões', {
            'fields': (
                ('is_active', 'is_staff', 'is_superuser')
            ),
            'description': "Gerencie permissões extras além das permissões definidas no perfil."
        }),
    )
