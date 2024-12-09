from django.db import models
from django.db.models import TextChoices
from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from django.core.exceptions import ValidationError

from clients_management.models import Client, Unit, Equipment

User = get_user_model()


class BaseOperation(models.Model):
    """
    Abstract base model for operations across different entity types
    """
    class OperationType(TextChoices):
        ADD = "A", "Adicionar"
        EDIT = "E", "Editar"
        DELETE = "D", "Deletar"
        CLOSED = "C", "-"

    class OperationStatus(TextChoices):
        REVIEW = "REV", "Em Análise"
        ACCEPTED = "A", "Aceito"
        REJECTED = "R", "Rejeitado"

    # Operation metadata
    operation_type = models.CharField(
        "Tipo de Operação",
        max_length=1,
        choices=OperationType.choices
    )
    operation_status = models.CharField(
        "Status da Operação",
        max_length=3,
        choices=OperationStatus.choices,
        default=OperationStatus.REVIEW
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="%(class)s_operations",
        verbose_name="Criado por",
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
        ordering = ["operation_status", "-created_at"]

    def clean(self):
        """
        Validate that only one operation is in "Em Análise" status for a specific entity
        """
        if self.operation_status == self.OperationStatus.REVIEW:
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

        # The first operation will always be ADD
        if (self.operation_type == self.OperationType.ADD and self.operation_status == self.OperationStatus.ACCEPTED):
            self.operation_type = self.OperationType.CLOSED

        # All other operations will be EDIT or DELETE. Those ones are needed only to temporary hold data
        if ((self.operation_type == self.OperationType.EDIT or self.operation_type == self.OperationType.DELETE)
                and self.operation_status == self.OperationStatus.ACCEPTED):
            return self.delete()

        super().save(*args, **kwargs)


class ClientOperation(BaseOperation, Client):
    """
    Model representing an operation on client data.
    """
    client_ptr = models.OneToOneField(
        Client, on_delete=models.CASCADE, parent_link=True, primary_key=True, related_name="operation")

    # Reference to original client (optional for add operations)
    original_client = models.ForeignKey(Client, on_delete=models.DO_NOTHING, null=True,
                                        blank=True, related_name="new_operations",
                                        verbose_name="Cliente", help_text="Cliente original associado à operação.")

    def clean(self):
        super().clean()

        self.active = False

        if ((self.operation_type == self.OperationType.ADD or self.operation_type == self.OperationType.CLOSED)
                and self.operation_status == self.OperationStatus.ACCEPTED):
            self.active = True

        if self.operation_type == self.OperationType.EDIT and self.operation_status == self.OperationStatus.ACCEPTED:
            self.original_client.cnpj = self.cnpj
            self.original_client.name = self.name
            self.original_client.email = self.email
            self.original_client.phone = self.phone
            self.original_client.address = self.address
            self.original_client.state = self.state
            self.original_client.city = self.city
            self.original_client.save()

        if self.operation_type == self.OperationType.DELETE and self.operation_status == self.OperationStatus.ACCEPTED:
            self.original_client.active = False
            self.original_client.save()

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.original_client:
            return {'original_client': self.original_client}
        return {'cnpj': self.cnpj}

    def __str__(self):
        return f"Operação {self.get_operation_type_display()} - {self.name}"

    class Meta:
        verbose_name = "Operação de Cliente"
        verbose_name_plural = "Operações de Clientes"


class UnitOperation(BaseOperation, Unit):
    """
    Model representing an operation on unit data.
    """
    unit_ptr = models.OneToOneField(
        Unit, on_delete=models.CASCADE, parent_link=True, primary_key=True, related_name="operation")

    # Reference to original unit (optional for add operations)
    original_unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='new_operations',
        verbose_name="Unidade",
        help_text="Unidade original associada à operação."
    )

    def clean(self):
        super().clean()

        if self.operation_type == self.OperationType.EDIT and self.operation_status == self.OperationStatus.ACCEPTED:
            self.original_unit.cnpj = self.cnpj
            self.original_unit.name = self.name
            self.original_unit.email = self.email
            self.original_unit.phone = self.phone
            self.original_unit.address = self.address
            self.original_unit.state = self.state
            self.original_unit.city = self.city
            self.original_unit.save()

        if self.operation_type == self.OperationType.DELETE and self.operation_status == self.OperationStatus.ACCEPTED:
            self.original_unit.delete()

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.original_unit:
            return {'original_unit': self.original_unit}
        return {'cnpj': self.cnpj, 'name': self.name}

    def __str__(self):
        return f"Operação {self.get_operation_type_display()} - {self.name}"

    class Meta:
        verbose_name = "Operação de Unidade"
        verbose_name_plural = "Operações de Unidades"


class EquipmentOperation(BaseOperation, Equipment):
    """
    Model representing an operation on equipment data.
    """
    equipment_ptr = models.OneToOneField(
        Equipment, on_delete=models.CASCADE, parent_link=True, primary_key=True, related_name="operation")

    # Reference to original equipment (optional for add operations)
    original_equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='new_operations',
        verbose_name="Equipamento",
        help_text="Equipamento original associado à operação."
    )

    def clean(self):
        super().clean()

        if self.operation_type == self.OperationType.EDIT and self.operation_status == self.OperationStatus.ACCEPTED:
            self.original_equipment.modality = self.modality
            self.original_equipment.manufacturer = self.manufacturer
            self.original_equipment.model = self.model
            self.original_equipment.series_number = self.series_number
            self.original_equipment.anvisa_registry = self.anvisa_registry
            self.original_equipment.equipment_photo = self.equipment_photo
            self.original_equipment.label_photo = self.label_photo
            self.original_equipment.save()

        if self.operation_type == self.OperationType.DELETE and self.operation_status == self.OperationStatus.ACCEPTED:
            self.original_equipment.delete()

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.original_equipment:
            return {'original_equipment': self.original_equipment}
        return {
            'series_number': self.series_number,
            'manufacturer': self.manufacturer,
            'model': self.model
        }

    class Meta:
        verbose_name = "Operação de Equipamento"
        verbose_name_plural = "Operações de Equipamentos"
