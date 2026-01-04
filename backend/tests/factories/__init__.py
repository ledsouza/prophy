from .users import UserFactory

from .materials import InstitutionalMaterialFactory

from .clients_management import (
    AccessoryFactory,
    AppointmentFactory,
    ClientFactory,
    EquipmentFactory,
    ModalityFactory,
    ProposalFactory,
    ServiceOrderFactory,
    UnitFactory,
)
from .requisitions import (
    ClientOperationFactory,
    EquipmentOperationFactory,
    UnitOperationFactory,
)

__all__ = [
    "UserFactory",
    "InstitutionalMaterialFactory",
    "AccessoryFactory",
    "AppointmentFactory",
    "ClientFactory",
    "EquipmentFactory",
    "ModalityFactory",
    "ProposalFactory",
    "ServiceOrderFactory",
    "UnitFactory",
    "ClientOperationFactory",
    "EquipmentOperationFactory",
    "UnitOperationFactory",
]
