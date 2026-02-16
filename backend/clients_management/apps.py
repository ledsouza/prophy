from django.apps import AppConfig


class GestaoClientesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "clients_management"
    verbose_name = "Gestão de Clientes"

    def ready(self) -> None:
        from clients_management import signals  # noqa: F401
