import factory
from validate_docbr import CNPJ

from requisitions.models import ClientOperation, EquipmentOperation, UnitOperation

from .clients_management import ClientFactory, EquipmentFactory, UnitFactory
from .users import UserFactory


class ClientOperationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ClientOperation

    operation_type = ClientOperation.OperationType.ADD
    operation_status = ClientOperation.OperationStatus.REVIEW
    created_by = factory.SubFactory(UserFactory)

    cnpj = factory.LazyFunction(lambda: CNPJ().generate())
    name = factory.Faker("company")
    email = factory.Sequence(lambda n: f"clientop{n}@example.com")
    phone = "11999999999"
    address = factory.Faker("street_address")
    state = "SP"
    city = "São Paulo"

    original_client = None

    @factory.post_generation
    def users(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.users.set(extracted)


class UnitOperationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UnitOperation

    operation_type = UnitOperation.OperationType.ADD
    operation_status = UnitOperation.OperationStatus.REVIEW
    created_by = factory.SubFactory(UserFactory)

    client = factory.SubFactory(ClientFactory)
    cnpj = factory.LazyFunction(lambda: CNPJ().generate())
    name = factory.Faker("company")
    email = factory.Sequence(lambda n: f"unitop{n}@example.com")
    phone = "11999999999"
    address = factory.Faker("street_address")
    state = "SP"
    city = "São Paulo"

    original_unit = None


class EquipmentOperationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EquipmentOperation

    operation_type = EquipmentOperation.OperationType.ADD
    operation_status = EquipmentOperation.OperationStatus.REVIEW
    created_by = factory.SubFactory(UserFactory)

    unit = factory.SubFactory(UnitFactory)
    modality = factory.SubFactory("tests.factories.clients_management.ModalityFactory")
    manufacturer = factory.Faker("company")
    model = factory.Faker("word")
    series_number = factory.Sequence(lambda n: f"SNOP-{n}")
    equipment_photo = factory.LazyFunction(lambda: EquipmentFactory().equipment_photo)
    label_photo = factory.LazyFunction(lambda: EquipmentFactory().label_photo)

    original_equipment = None
