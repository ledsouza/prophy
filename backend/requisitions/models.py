from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from django.core.exceptions import ValidationError

from clients_management.models import Client, Unit, Equipment

User = get_user_model()


class BaseOperationModel(models.Model):
    """
    Abstract base model for operations across different entity types
    """
    OPERATION_TYPES = (
        ("A", "Adicionar"),
        ("E", "Editar"),
        ("D", "Deletar")
    )

    OPERATION_STATUS = (
        ("A", "Em Análise"),
        ("AC", "Aceito"),
        ("R", "Rejeitado")
    )

    # Operation metadata
    operation_type = models.CharField(
        "Tipo de Operação",
        max_length=1,
        choices=OPERATION_TYPES
    )
    operation_status = models.CharField(
        "Status da Operação",
        max_length=2,
        choices=OPERATION_STATUS,
        default="A"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="%(class)s_operations",
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    comments = models.TextField(
        "Comentários",
        blank=True,
        null=True,
        help_text="Feedback do Gerente Prophy e Físico Médico Interno."
    )

    class Meta:
        abstract = True
        ordering = ["operation_type", "-created_at"]

    def clean(self):
        """
        Validate that only one operation is in "Em Análise" status for a specific entity
        """
        if self.operation_status == "A":
            # Check for existing operations in analysis for the same entity
            existing_operations = self.__class__.objects.filter(
                operation_status="A",
                **self.get_entity_filter()
            )

            if self.pk:  # If updating existing record
                existing_operations = existing_operations.exclude(pk=self.pk)

            if existing_operations.exists():
                raise ValidationError(
                    _("Já existe uma operação em análise.")
                )

    def get_entity_filter(self):
        """
        Override in subclasses to provide entity-specific filtering
        """
        raise NotImplementedError("Subclasses must implement this method")

    def save(self, *args, **kwargs):
        """
        Custom save method to handle operation logic
        """
        self.full_clean()
        super().save(*args, **kwargs)


class ClientOperation(BaseOperationModel, Client):
    """
    Model representing an operation on client data.
    """
    # Reference to original client (optional for 'Adicionar' operations)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True,
                               blank=True, related_name="client_operations", verbose_name="Cliente")

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.client:
            return {'client': self.client}
        return {'cnpj': self.cnpj}

    def __str__(self):
        return f"Operação {self.get_operation_type_display()} - {self.name}"

    class Meta:
        verbose_name = "Operação de Cliente"
        verbose_name_plural = "Operações de Clientes"


class UnitOperation(BaseOperationModel, Unit):
    """
    Model representing an operation on unit data.
    """
    # Reference to original unit (optional for 'Adicionar' operations)
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='unit_operations',
    )

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.unit:
            return {'unit': self.unit}
        return {'cnpj': self.cnpj, 'name': self.name}

    def __str__(self):
        return f"Operação {self.get_operation_type_display()} - {self.name}"

    class Meta:
        verbose_name = "Operação de Unidade"
        verbose_name_plural = "Operações de Unidades"


class EquipmentOperation(BaseOperationModel, Equipment):
    """
    Model representing an operation on equipment data.
    """
    # Reference to original equipment (optional for 'Adicionar' operations)
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='equipment_operations',
    )

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.equipment:
            return {'equipment': self.equipment}
        return {
            'series_number': self.series_number,
            'manufacturer': self.manufacturer,
            'model': self.model
        }

    class Meta:
        verbose_name = "Operação de Equipamento"
        verbose_name_plural = "Operações de Equipamentos"
