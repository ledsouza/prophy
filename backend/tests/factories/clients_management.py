import factory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from validate_docbr import CNPJ

from clients_management.models import (
    Accessory,
    Appointment,
    Client,
    Equipment,
    Modality,
    Proposal,
    Report,
    ServiceOrder,
    Unit,
)
from users.models import UserAccount


class ClientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Client
        skip_postgeneration_save = True

    cnpj = factory.LazyFunction(lambda: CNPJ().generate())
    name = factory.Faker("company")
    email = factory.Sequence(lambda n: f"client{n}@example.com")
    phone = "11999999999"
    address = factory.Faker("street_address")
    state = "SP"
    city = "São Paulo"
    is_active = True

    @factory.post_generation
    def users(
        self,
        create: bool,
        extracted: list[UserAccount] | None,
        **kwargs,
    ) -> None:
        if not create:
            return
        if extracted is None:
            return

        self.users.set(extracted)


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Unit
        skip_postgeneration_save = True

    client = factory.SubFactory(ClientFactory)

    cnpj = factory.LazyFunction(lambda: CNPJ().generate())
    name = factory.Faker("company")
    email = factory.Sequence(lambda n: f"unit{n}@example.com")
    phone = "11999999999"
    address = factory.Faker("street_address")
    state = "SP"
    city = "São Paulo"


class ModalityFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Modality
        skip_postgeneration_save = True

    name = factory.Faker("word")
    accessory_type = Modality.AccessoryType.NONE


class EquipmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Equipment
        skip_postgeneration_save = True

    unit = factory.SubFactory(UnitFactory)
    modality = factory.SubFactory(ModalityFactory)

    manufacturer = factory.Faker("company")
    model = factory.Faker("word")
    series_number = factory.Sequence(lambda n: f"SN-{n}")
    equipment_photo = SimpleUploadedFile(
        "equipment.jpg",
        b"file_content",
        content_type="image/jpeg",
    )
    label_photo = SimpleUploadedFile(
        "label.jpg",
        b"file_content",
        content_type="image/jpeg",
    )


class AccessoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Accessory
        skip_postgeneration_save = True

    equipment = factory.SubFactory(EquipmentFactory)
    category = Modality.AccessoryType.NONE
    manufacturer = factory.Faker("company")
    model = factory.Faker("word")
    series_number = factory.Sequence(lambda n: f"ASN-{n}")
    equipment_photo = SimpleUploadedFile(
        "accessory.jpg",
        b"file_content",
        content_type="image/jpeg",
    )
    label_photo = SimpleUploadedFile(
        "accessory_label.jpg",
        b"file_content",
        content_type="image/jpeg",
    )


class ProposalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Proposal
        skip_postgeneration_save = True

    cnpj = factory.LazyFunction(lambda: CNPJ().generate())
    contact_name = factory.Faker("name")
    email = factory.Sequence(lambda n: f"contact{n}@example.com")
    contact_phone = "11999999999"

    state = "SP"
    city = "São Paulo"

    value = 1000
    contract_type = Proposal.ContractType.ANNUAL
    status = Proposal.Status.ACCEPTED

    date = factory.Faker("date_this_year")

    pdf_version = SimpleUploadedFile(
        "proposal.pdf",
        b"file_content",
        content_type="application/pdf",
    )
    word_version = SimpleUploadedFile(
        "proposal.docx",
        b"file_content",
        content_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
    )


class AppointmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Appointment
        skip_postgeneration_save = True

    unit = factory.SubFactory(UnitFactory)
    date = factory.Faker("date_time_this_year", tzinfo=timezone.get_current_timezone())
    type = Appointment.Type.IN_PERSON
    status = Appointment.Status.PENDING

    contact_name = factory.Faker("name")
    contact_phone = "11999999999"


class ReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Report
        skip_postgeneration_save = True

    completion_date = factory.Faker("date_this_year")
    report_type = Report.ReportType.QUALITY_CONTROL

    file = SimpleUploadedFile(
        "report.pdf",
        b"file_content",
        content_type="application/pdf",
    )

    # Most tests for notifications will likely use unit-based reports,
    # but the factory supports passing equipment=... explicitly.
    unit = factory.SubFactory(UnitFactory)
    equipment = None


class ServiceOrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ServiceOrder
        skip_postgeneration_save = True

    subject = factory.Faker("sentence", nb_words=4)
    description = factory.Faker("paragraph")
    conclusion = factory.Faker("paragraph")
    updates = factory.Faker("paragraph")

    @factory.post_generation
    def equipments(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.equipments.set(extracted)
