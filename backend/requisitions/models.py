from django.db import models
from django.db.models import TextChoices
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from clients_management.models import Client, Unit, Equipment

User = get_user_model()


class BaseOperation(models.Model):
    """
    Abstract base model providing a standardized operation workflow.
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
    note = models.TextField(
        "Nota",
        blank=True,
        null=True,
        help_text="Anotações para descrever a operação."
    )

    class Meta:
        abstract = True
        ordering = ["operation_status", "-created_at"]

    def clean(self):
        """
        Validate that only one operation is in analysis status for a specific entity
        """
        if self.operation_status == self.OperationStatus.REVIEW:
            # Check for existing operations in analysis for the same entity
            existing_operations = self.__class__.objects.filter(
                operation_status=BaseOperation.OperationStatus.REVIEW,
                **self.get_entity_filter()
            )

            if existing_operations.exists():
                raise ValidationError("Já existe uma operação em análise.")

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

        is_accepted_add = self.operation_type == self.OperationType.ADD and self.operation_status == self.OperationStatus.ACCEPTED
        is_accepted_edit_or_delete = ((self.operation_type == self.OperationType.EDIT or self.operation_type == self.OperationType.DELETE)
                                      and self.operation_status == self.OperationStatus.ACCEPTED)

        # The first operation will always be ADD. Set them to closed after accepted.
        if is_accepted_add:
            self.operation_type = self.OperationType.CLOSED

        # All other operations will be EDIT or DELETE. Those ones are needed only to temporary hold records. Delete them after accepted.
        if is_accepted_edit_or_delete:
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

        is_accepted_add_or_closed = ((self.operation_type == self.OperationType.ADD or self.operation_type == self.OperationType.CLOSED)
                                     and self.operation_status == self.OperationStatus.ACCEPTED)
        is_accepted_edit = self.operation_type == self.OperationType.EDIT and self.operation_status == self.OperationStatus.ACCEPTED
        is_accepted_delete = self.operation_type == self.OperationType.DELETE and self.operation_status == self.OperationStatus.ACCEPTED

        if is_accepted_add_or_closed:
            self.active = True

        if is_accepted_edit:
            self._update_client()

        if is_accepted_delete:
            self._delete_client()

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.original_client:
            return {'original_client': self.original_client}
        return {'cnpj': self.cnpj}

    def _update_client(self) -> None:
        """
        Update the original client with new information.
        """
        if not self.original_client:
            raise ValidationError(
                "Não foi encontrado o cliente associado para atualizar.")

        update_fields = [
            'name', 'email', 'phone', 'address',
            'state', 'city', 'cnpj'
        ]

        for field in update_fields:
            setattr(self.original_client, field,
                    getattr(self.client_ptr, field))

        self.original_client.save()

    def _delete_client(self) -> None:
        """
        Mark the original client as inactive.
        """
        if not self.original_client:
            raise ValidationError(
                "Não foi encontrado o cliente associado para remover.")

        self.original_client.is_active = False
        self.original_client.save()

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

        is_accepted_edit = self.operation_type == self.OperationType.EDIT and self.operation_status == self.OperationStatus.ACCEPTED
        is_accepted_delete = self.operation_type == self.OperationType.DELETE and self.operation_status == self.OperationStatus.ACCEPTED

        if is_accepted_edit:
            self._update_unit()

        if is_accepted_delete:
            self._delete_unit()

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.original_unit:
            return {'original_unit': self.original_unit}
        return {'cnpj': self.cnpj}

    def _update_unit(self) -> None:
        """
        Update the original unit with new information.
        """
        if not self.original_unit:
            raise ValidationError(
                "Não foi encontrada a unidade associada para atualizar.")

        update_fields = [
            'cnpj', 'name', 'email', 'phone',
            'address', 'state', 'city'
        ]

        for field in update_fields:
            setattr(self.original_unit, field, getattr(self.unit_ptr, field))

        self.original_unit.save()

    def _delete_unit(self) -> None:
        """
        Handle unit deletion process.
        """
        if not self.original_unit:
            raise ValidationError(
                "Não foi encontrada a unidade associada para deletar.")

        self.original_unit.delete()

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

        is_accepted_edit = self.operation_type == self.OperationType.EDIT and self.operation_status == self.OperationStatus.ACCEPTED
        is_accepted_delete = self.operation_type == self.OperationType.DELETE and self.operation_status == self.OperationStatus.ACCEPTED

        if is_accepted_edit:
            self._update_equipment()

        if is_accepted_delete:
            self._delete_equipment()

    def get_entity_filter(self):
        """
        Provide filtering for existing operations in analysis
        """
        if self.original_equipment:
            return {'original_equipment': self.original_equipment}
        return {
            'series_number': self.series_number
        }

    def _update_equipment(self) -> None:
        """
        Update the original equipment with new information.
        """
        if not self.original_equipment:
            raise ValidationError(
                "Não foi encontrado o equipamento associado para atualizar.")

        update_fields = [
            'modality', 'manufacturer', 'model', 'series_number',
            'anvisa_registry', 'equipment_photo', 'label_photo'
        ]

        for field in update_fields:
            setattr(self.original_equipment, field,
                    getattr(self.equipment_ptr, field))

        self.original_equipment.save()

    def _delete_equipment(self) -> None:
        """
        Handle equipment deletion process.
        """
        if not self.original_equipment:
            raise ValidationError(
                "Não foi encontrado o equipamento associado para deletar.")

        self.original_equipment.delete()

    class Meta:
        verbose_name = "Operação de Equipamento"
        verbose_name_plural = "Operações de Equipamentos"
