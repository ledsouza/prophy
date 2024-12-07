from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from users.models import UserAccount


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = UserAccount
        fields = "__all__"


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = UserAccount
        fields = "__all__"


@admin.register(UserAccount)
class UserAccountAdmin(BaseUserAdmin):
    change_form_template = 'admin/change_form.html'
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

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

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('cpf', 'name', 'email', 'phone', 'password1', 'password2', 'role'),
        }),
    )
