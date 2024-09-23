from django.apps import AppConfig


class AutenticacaoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'autenticacao'
    verbose_name = "Autenticações e Permissões"

    def ready(self) -> None:
        import autenticacao.signals
