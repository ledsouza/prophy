from django.core.exceptions import ValidationError
from django.db import models

from users.models import UserAccount


class InstitutionalMaterial(models.Model):
    class Visibility(models.TextChoices):
        PUBLIC = "PUB", "Público"
        INTERNAL = "INT", "Interno"

    class PublicCategory(models.TextChoices):
        SIGNS = "SIG", "Sinalizações / Fluxogramas / Informativos"
        TEAM_IO = "IOE", "Instruções Operacionais de Equipe"
        TERMS = "TER", "Termos"
        POPS = "POP", "POPs"
        LAW = "LEG", "Legislação Vigente"
        GUIDES = "GUI", "Guias"
        MANUALS = "MAN", "Manuais"
        OTHERS = "OUT", "Outros"

    class InternalCategory(models.TextChoices):
        TEAM_IO = "IOE", "Instruções Operacionais de Equipe"
        POPS = "POP", "POPs"
        GUIDES = "GUI", "Guias"
        MANUALS = "MAN", "Manuais"
        REPORT_TEMPLATES = "MRE", "Modelos de Relatórios"
        DOC_TEMPLATES = "MDO", "Modelos de Documentos"
        BRANDING = "IDV", "Material Institucional de Identidade Visual"
        OTHERS = "OUT", "Outros"

    ALL_CATEGORY_CHOICES = tuple(PublicCategory.choices) + tuple(
        InternalCategory.choices
    )

    title = models.CharField("Título", max_length=150)
    description = models.TextField("Descrição", blank=True, null=True)
    visibility = models.CharField(
        "Visibilidade",
        max_length=3,
        choices=Visibility.choices,
    )
    category = models.CharField(
        "Categoria",
        max_length=4,
        choices=ALL_CATEGORY_CHOICES,
    )
    file = models.FileField("Arquivo", upload_to="materials/")
    allowed_external_users = models.ManyToManyField(
        UserAccount,
        related_name="institutional_materials_allowed",
        blank=True,
        limit_choices_to={"role": UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST},
        verbose_name="Externos com acesso",
    )
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}

        match self.visibility:
            case self.Visibility.PUBLIC:
                # Guard M2M access for unsaved instances
                if self.pk and self.allowed_external_users.exists():
                    errors["allowed_external_users"] = (
                        "Materiais públicos não aceitam permissões específicas."
                    )

                valid_public = {code for code, _ in self.PublicCategory.choices}
                if self.category not in valid_public:
                    errors["category"] = "Categoria inválida para material público."

            case self.Visibility.INTERNAL:
                valid_internal = {code for code, _ in self.InternalCategory.choices}
                if self.category not in valid_internal:
                    errors["category"] = "Categoria inválida para material interno."

            case _:
                # Choices already constrain values; keep as no-op fallback
                pass

        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return f"{self.title} ({self.get_visibility_display()})"

    class Meta:
        verbose_name = "Material Institucional"
        verbose_name_plural = "Materiais Institucionais"
        ordering = ["-created_at"]
