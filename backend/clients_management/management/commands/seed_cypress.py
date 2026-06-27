import uuid
from datetime import date, timedelta

from clients_management.models import (
    Accessory,
    Appointment,
    Equipment,
    Modality,
    Proposal,
    Report,
    ServiceOrder,
    Unit,
)
from django.conf import settings
from django.core.files import File
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from materials.models import InstitutionalMaterial
from requisitions.models import ClientOperation, EquipmentOperation, UnitOperation
from users.models import UserAccount

from ._seed_common import (
    APPROVED_PROPOSAL_CNPJ,
    COMPLIANT_APPOINTMENT_CNPJ,
    CPF_ADMIN,
    CPF_CLIENT_MANAGER,
    CPF_COMERCIAL,
    CPF_EXTERNAL_PHYSICIST,
    CPF_INTERNAL_PHYSICIST,
    CPF_UNIT_MANAGER,
    ELIGIBLE_REGISTRATION_CNPJ,
    EQUIPMENT_LABEL_PHOTO_PATH,
    EQUIPMENT_PHOTO_PATH,
    FIXTURE_PATH,
    NO_PROPOSAL_CNPJ,
    PASSWORD,
    PENDING_APPOINTMENT_CNPJ,
    PROPOSAL_PDF_PATH,
    PROPOSAL_WORD_PATH,
    REGISTERED_CNPJ,
    REJECTED_PROPOSAL_CNPJ,
    create_fixture_path,
    create_groups,
    get_accessory_type,
    make_report_file,
    make_report_word_file,
    populate_modalities,
    raise_postgres_id_floor,
    write_json_file,
)

# Explicit CNPJ for client_with_comercial (São Lucas).
# populate.py used fake_cnpj() here; seed_cypress fixes it.
CLIENT_SAO_LUCAS_CNPJ = "35678914000190"

# Explicit phone numbers for each role user (unique-constrained field).
PHONE_ADMIN = "51991000100"
PHONE_CLIENT_MANAGER = "51991000101"
PHONE_UNIT_MANAGER = "51991000102"
PHONE_COMERCIAL = "51991000103"
PHONE_EXTERNAL_PHYSICIST = "51991000104"
PHONE_INTERNAL_PHYSICIST = "51991000105"
PHONE_E2E_PENDING = "51991000110"
PHONE_E2E_COMPLIANT = "51991000111"


class Command(BaseCommand):
    help = "Seed the database with deterministic, curated data for Cypress E2E tests."

    @transaction.atomic
    def handle(self, *args, **options):
        raise_postgres_id_floor()
        create_groups()
        populate_modalities()

        users = self._seed_users()
        default_clients = self._seed_clients()
        default_units = self._seed_units()
        default_equipments = self._seed_equipments()
        self._seed_accessories()
        self._seed_reports()
        self._seed_service_orders()
        approved_cnpjs = self._seed_proposals()
        self._seed_pending_appointment_scenarios()
        self._seed_materials()

        self._write_fixtures(
            approved_cnpjs,
            users,
            default_clients,
            default_units,
            default_equipments,
        )
        self.stdout.write(
            self.style.SUCCESS("Cypress seed complete.")
        )

    # ------------------------------------------------------------------ users

    def _seed_users(self) -> dict:
        def _fixture(ua):
            return {
                "cpf": ua.cpf,
                "password": PASSWORD,
                "name": ua.name,
                "email": ua.email,
                "phone": ua.phone,
            }

        admin = UserAccount.objects.create_user(
            id=1000,
            cpf=CPF_ADMIN,
            email="alexandre.ferret@email.com",
            phone=PHONE_ADMIN,
            password=PASSWORD,
            name="Alexandre Ferret",
            role=UserAccount.Role.PROPHY_MANAGER,
            is_staff=True,
        )
        client_manager = UserAccount.objects.create_user(
            id=1001,
            cpf=CPF_CLIENT_MANAGER,
            email="leandro.souza.159@gmail.com",
            phone=PHONE_CLIENT_MANAGER,
            password=PASSWORD,
            name="Leandro Souza",
            role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
        )
        unit_manager = UserAccount.objects.create_user(
            id=1002,
            cpf=CPF_UNIT_MANAGER,
            email="fabricio.fernandes@prophy.com.br",
            phone=PHONE_UNIT_MANAGER,
            password=PASSWORD,
            name="Fabricio Fernandes",
            role=UserAccount.Role.UNIT_MANAGER,
        )
        comercial = UserAccount.objects.create_user(
            id=1003,
            cpf=CPF_COMERCIAL,
            email="brenda.candeia@prophy.com.br",
            phone=PHONE_COMERCIAL,
            password=PASSWORD,
            name="Brenda Candeia",
            role=UserAccount.Role.COMMERCIAL,
        )
        external_physicist = UserAccount.objects.create_user(
            id=1004,
            cpf=CPF_EXTERNAL_PHYSICIST,
            email="gato.comunista@prophy.com.br",
            phone=PHONE_EXTERNAL_PHYSICIST,
            password=PASSWORD,
            name="Gato Comunista",
            role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        )
        internal_physicist = UserAccount.objects.create_user(
            id=1005,
            cpf=CPF_INTERNAL_PHYSICIST,
            email="paulo.capitalista@prophy.com.br",
            phone=PHONE_INTERNAL_PHYSICIST,
            password=PASSWORD,
            name="Paulo Capitalista",
            role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        )

        return {
            "admin_user": _fixture(admin),
            "client_user": _fixture(client_manager),
            "unit_manager_user": _fixture(unit_manager),
            "comercial_user": _fixture(comercial),
            "external_physicist_user": _fixture(external_physicist),
            "internal_physicist_user": _fixture(internal_physicist),
        }

    # ---------------------------------------------------------------- clients

    def _seed_clients(self) -> dict:
        def _fixture(c):
            return {
                "cnpj": c.cnpj,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "state": c.state,
                "city": c.city,
                "is_active": c.is_active,
                "id": c.id,
            }

        admin = UserAccount.objects.get(cpf=CPF_ADMIN)
        client_manager = UserAccount.objects.get(cpf=CPF_CLIENT_MANAGER)
        comercial = UserAccount.objects.get(cpf=CPF_COMERCIAL)
        external_physicist = UserAccount.objects.get(cpf=CPF_EXTERNAL_PHYSICIST)
        internal_physicist = UserAccount.objects.get(cpf=CPF_INTERNAL_PHYSICIST)

        client1 = ClientOperation.objects.create(
            id=1000,
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            cnpj=REGISTERED_CNPJ,
            name="Hospital de Clínicas de Porto Alegre",
            email="secretariageral@hcpa.edu.br",
            phone="5133596100",
            address=(
                "Rua Ramiro Barcelos, 2350 Bloco A, "
                "Av. Protásio Alves, 211 - Santa Cecília"
            ),
            state="RS",
            city="Porto Alegre",
            is_active=True,
        )
        client1.users.add(client_manager)
        client1.users.add(internal_physicist)

        client2 = ClientOperation.objects.create(
            id=1001,
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            cnpj="90217758000179",
            name="Santa Casa de Porto Alegre",
            email="ouvidoria@santacasa.tche.br",
            phone="5132148000",
            address="Rua Professor Annes Dias, 295 - Centro Histórico",
            state="RS",
            city="Porto Alegre",
            is_active=True,
        )
        client2.users.add(client_manager)
        client2.users.add(admin)
        client2.users.add(comercial)
        client2.users.add(external_physicist)

        client_empty = ClientOperation.objects.create(
            id=1002,
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            cnpj="57428412000144",
            name="Hospital Cristo Redentor",
            email="ouvidoria@ghc.br",
            phone="5133574100",
            address="Rua Domingos Rubbo, 20 - Cristo Redentor",
            state="RS",
            city="Porto Alegre",
            is_active=True,
        )
        client_empty.users.add(client_manager)

        client_with_comercial = ClientOperation.objects.create(
            id=1003,
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            cnpj=CLIENT_SAO_LUCAS_CNPJ,
            name="Hospital São Lucas da PUCRS",
            email="ouvidoria@saolucas.br",
            phone="5133365000",
            address="Av. Ipiranga, 6690 - Partenon",
            state="RS",
            city="Porto Alegre",
            is_active=True,
        )
        client_with_comercial.users.add(client_manager)
        client_with_comercial.users.add(internal_physicist)
        client_with_comercial.users.add(comercial)

        return {
            "client1": _fixture(client1),
            "client2": _fixture(client2),
            "client_empty": _fixture(client_empty),
            "client_with_comercial": _fixture(client_with_comercial),
        }

    # ------------------------------------------------------------------ units

    def _seed_units(self) -> dict:
        def _fixture(u):
            return {
                "user": u.user.id if u.user else None,
                "client": u.client.id,
                "name": u.name,
                "cnpj": u.cnpj,
                "email": u.email,
                "phone": u.phone,
                "address": u.address,
                "state": u.state,
                "city": u.city,
                "id": u.id,
            }

        admin = UserAccount.objects.get(cpf=CPF_ADMIN)
        unit_manager = UserAccount.objects.get(cpf=CPF_UNIT_MANAGER)
        client1 = ClientOperation.objects.get(id=1000)
        client2 = ClientOperation.objects.get(id=1001)

        unit1 = UnitOperation.objects.create(
            id=1000,
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            user=unit_manager,
            client=client1,
            name="Cardiologia",
            cnpj="12345678000195",
            email="cardiologia@hcpa.edu.br",
            phone="5133596110",
            address="Rua Ramiro Barcelos, 2350 - Bloco A",
            state="RS",
            city="Porto Alegre",
        )
        unit2 = UnitOperation.objects.create(
            id=1001,
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            client=client1,
            name="Radiologia",
            cnpj="98476532000102",
            email="radiologia@hcpa.edu.br",
            phone="5133596120",
            address="Rua Ramiro Barcelos, 2350 - Bloco B",
            state="RS",
            city="Porto Alegre",
        )
        unit3 = UnitOperation.objects.create(
            id=1002,
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            client=client1,
            name="Hemodinâmica",
            cnpj="11223344000500",
            email="hemodinamica@hcpa.edu.br",
            phone="5133596130",
            address="Rua Ramiro Barcelos, 2350 - Bloco C",
            state="RS",
            city="Porto Alegre",
        )
        unit4 = UnitOperation.objects.create(
            id=1003,
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            client=client2,
            name="Santa Rita",
            cnpj="55667788000186",
            email="santarita@santacasa.tche.br",
            phone="5132148010",
            address="Rua Professor Annes Dias, 295 - Ala Norte",
            state="RS",
            city="Porto Alegre",
        )

        return {
            "unit1": _fixture(unit1),
            "unit2": _fixture(unit2),
            "unit3": _fixture(unit3),
            "unit4": _fixture(unit4),
        }

    # --------------------------------------------------------------- equipment

    def _seed_equipments(self) -> dict:
        def _fixture(eq):
            return {
                "unit": eq.unit.id,
                "modality": eq.modality.name,
                "manufacturer": eq.manufacturer,
                "model": eq.model,
                "series_number": eq.series_number,
                "anvisa_registry": eq.anvisa_registry,
                "equipment_photo": (
                    eq.equipment_photo.url if eq.equipment_photo else None
                ),
                "label_photo": (
                    eq.label_photo.url if eq.label_photo else None
                ),
                "id": eq.id,
            }

        client_manager = UserAccount.objects.get(cpf=CPF_CLIENT_MANAGER)
        unit1 = Unit.objects.get(id=1000)
        mamografia = Modality.objects.get(name="Mamografia")

        with (
            EQUIPMENT_PHOTO_PATH.open(mode="rb") as f,
            EQUIPMENT_LABEL_PHOTO_PATH.open(mode="rb") as f_label,
        ):
            photo_file = File(f, name=EQUIPMENT_PHOTO_PATH.name)
            label_file = File(f_label, name=EQUIPMENT_LABEL_PHOTO_PATH.name)

            eq1 = EquipmentOperation.objects.create(
                id=1000,
                operation_type=EquipmentOperation.OperationType.CLOSED,
                operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
                created_by=client_manager,
                unit=unit1,
                modality=mamografia,
                manufacturer="Siemens",
                model="MAMMOMAT-100",
                series_number="AABB-123456",
                anvisa_registry="AABBCCDDEEEFFF",
                equipment_photo=photo_file,
                label_photo=label_file,
            )
            eq2 = EquipmentOperation.objects.create(
                id=1001,
                operation_type=EquipmentOperation.OperationType.CLOSED,
                operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
                created_by=client_manager,
                unit=unit1,
                modality=mamografia,
                manufacturer="GE",
                model="SENOGRAPHE-200",
                series_number="CCDD-654321",
                anvisa_registry="CCDDEEAAABBCCC",
                equipment_photo=photo_file,
                label_photo=label_file,
            )

        return {
            "equipment1": _fixture(eq1),
            "equipment2": _fixture(eq2),
        }

    # ------------------------------------------------------------ accessories

    def _seed_accessories(self) -> None:
        accessories_to_create = []
        with (
            EQUIPMENT_PHOTO_PATH.open(mode="rb") as f,
            EQUIPMENT_LABEL_PHOTO_PATH.open(mode="rb") as f_label,
        ):
            photo_file = File(f, name=EQUIPMENT_PHOTO_PATH.name)
            label_file = File(f_label, name=EQUIPMENT_LABEL_PHOTO_PATH.name)

            for eq in Equipment.objects.all():
                accessory_type = get_accessory_type(eq.modality.name)
                if accessory_type == Modality.AccessoryType.NONE:
                    continue
                accessories_to_create.append(
                    Accessory(
                        equipment=eq,
                        category=accessory_type,
                        manufacturer=eq.manufacturer,
                        model="DET-001",
                        series_number="ZZZZ-000001",
                        equipment_photo=photo_file,
                        label_photo=label_file,
                    )
                )

            if accessories_to_create:
                Accessory.objects.bulk_create(accessories_to_create)

    # --------------------------------------------------------------- reports

    def _seed_reports(self) -> None:
        unit1000 = Unit.objects.get(id=1000)
        eq1000 = Equipment.objects.get(id=1000)
        eq1001 = Equipment.objects.get(id=1001)

        rtype = Report.UNIT_ONLY_TYPES[0]
        Report.objects.create(
            completion_date=date(2027, 5, 10),
            pdf_file=make_report_file(rtype, "Unit 1000"),
            word_file=make_report_word_file(rtype, "Unit 1000"),
            unit=unit1000,
            report_type=rtype,
        )

        due_type = (
            Report.UNIT_ONLY_TYPES[1] if len(Report.UNIT_ONLY_TYPES) > 1 else rtype
        )
        Report.objects.create(
            completion_date=date.today() - timedelta(days=365 - 30),
            due_date=date.today() + timedelta(days=30),
            pdf_file=make_report_file(due_type, "Unit 1000 - due soon"),
            word_file=make_report_word_file(due_type, "Unit 1000 - due soon"),
            unit=unit1000,
            report_type=due_type,
        )

        eq_type = Report.EQUIPMENT_ONLY_TYPES[0]
        Report.objects.create(
            completion_date=date.today() - timedelta(days=100),
            pdf_file=make_report_file(eq_type, "Siemens-MAMMOMAT-100"),
            word_file=make_report_word_file(eq_type, "Siemens-MAMMOMAT-100"),
            equipment=eq1000,
            report_type=eq_type,
        )
        Report.objects.create(
            completion_date=date.today() - timedelta(days=120),
            pdf_file=make_report_file(eq_type, "GE-SENOGRAPHE-200"),
            word_file=make_report_word_file(eq_type, "GE-SENOGRAPHE-200"),
            equipment=eq1001,
            report_type=eq_type,
        )

    # --------------------------------------------------------- service orders

    def _seed_service_orders(self) -> None:
        admin = UserAccount.objects.get(cpf=CPF_ADMIN)
        unit1000 = Unit.objects.get(id=1000)
        eq_list = list(Equipment.objects.filter(id__in=[1000, 1001]).order_by("id"))

        so1 = ServiceOrder.objects.create(
            id=1000,
            subject="Calibração de Mamógrafo",
            description=(
                "Equipamento apresentando imagens com qualidade inferior ao padrão "
                "esperado. Necessária calibração completa do sistema de aquisição."
            ),
            conclusion=(
                "Equipamento calibrado e testado com sucesso. "
                "Qualidade das imagens dentro dos parâmetros aceitáveis."
            ),
            responsible_prophy=admin,
        )
        if eq_list:
            so1.equipments.add(eq_list[0])

        Appointment.objects.create(
            id=1000,
            date=timezone.now() + timedelta(days=7),
            status=Appointment.Status.CONFIRMED,
            type=Appointment.Type.IN_PERSON,
            justification=None,
            contact_phone="51991000200",
            contact_name="Contato Agendamento 1",
            service_order=None,
            unit=unit1000,
        )

        so2 = ServiceOrder.objects.create(
            id=1001,
            subject="Manutenção Preventiva",
            description=(
                "Manutenção preventiva programada conforme cronograma anual. "
                "Verificação geral dos componentes e limpeza do sistema."
            ),
            conclusion=(
                "Manutenção preventiva executada conforme protocolo. "
                "Equipamento liberado para uso."
            ),
            responsible_prophy=admin,
        )
        if len(eq_list) > 1:
            so2.equipments.add(eq_list[1])

        Appointment.objects.create(
            id=1001,
            date=timezone.now() - timedelta(days=14),
            status=Appointment.Status.FULFILLED,
            type=Appointment.Type.ONLINE,
            justification=None,
            contact_phone="51991000201",
            contact_name="Contato Agendamento 2",
            service_order=so2,
            unit=unit1000,
        )

        Appointment.objects.create(
            id=1002,
            date=timezone.now() + timedelta(days=14),
            status=Appointment.Status.PENDING,
            type=Appointment.Type.IN_PERSON,
            justification=None,
            contact_phone="51991000202",
            contact_name="Contato Agendamento 3",
            service_order=None,
            unit=unit1000,
        )

        Appointment.objects.create(
            id=1003,
            date=timezone.now() + timedelta(days=21),
            status=Appointment.Status.PENDING,
            type=Appointment.Type.ONLINE,
            justification=None,
            contact_phone="51991000203",
            contact_name="Contato Agendamento 4",
            service_order=None,
            unit=unit1000,
        )

        Appointment.objects.create(
            id=1004,
            date=timezone.now() - timedelta(days=7),
            status=Appointment.Status.UNFULFILLED,
            type=Appointment.Type.ONLINE,
            justification="Visita não realizada no dia agendado.",
            contact_phone="51991000204",
            contact_name="Contato Agendamento 5",
            service_order=None,
            unit=unit1000,
        )

    # --------------------------------------------------------------- proposals

    def _seed_proposals(self) -> list[str]:
        threshold_date = date.today() - timedelta(days=365 - 30)
        admin = UserAccount.objects.get(cpf=CPF_ADMIN)
        comercial = UserAccount.objects.get(cpf=CPF_COMERCIAL)

        with (
            PROPOSAL_PDF_PATH.open(mode="rb") as pdf,
            PROPOSAL_WORD_PATH.open(mode="rb") as word,
        ):
            pdf_file = File(pdf, name=PROPOSAL_PDF_PATH.name)
            word_file = File(word, name=PROPOSAL_WORD_PATH.name)

            Proposal.objects.create(
                cnpj=REJECTED_PROPOSAL_CNPJ,
                city="Porto Alegre",
                state="RS",
                contact_name="Contato Proposta Rejeitada",
                contact_phone="51991000300",
                email="contato.rejeitada@example.com",
                date=date(2024, 1, 15),
                value=45000.00,
                contract_type=Proposal.ContractType.ANNUAL,
                status=Proposal.Status.REJECTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )

            Proposal.objects.create(
                cnpj=APPROVED_PROPOSAL_CNPJ,
                city="Porto Alegre",
                state="RS",
                contact_name="Contato Proposta Aprovada",
                contact_phone="51991000301",
                email="contato.aprovada@example.com",
                date=date(2024, 3, 10),
                value=80000.00,
                contract_type=Proposal.ContractType.ANNUAL,
                status=Proposal.Status.ACCEPTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )

            # Renewal notification test: client2 (Santa Casa)
            Proposal.objects.create(
                cnpj="90217758000179",
                city="Porto Alegre",
                state="RS",
                contact_name="Contato Renovação Teste",
                contact_phone="51991000302",
                email="renovacao@santacasa.tche.br",
                date=threshold_date,
                value=50000.00,
                contract_type=Proposal.ContractType.ANNUAL,
                status=Proposal.Status.ACCEPTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )

            # Win-back notification test: REJECTED_PROPOSAL_CNPJ
            winback_client = ClientOperation.objects.filter(
                cnpj=REJECTED_PROPOSAL_CNPJ
            ).first()
            if winback_client is None:
                winback_client = ClientOperation.objects.create(
                    operation_type=ClientOperation.OperationType.CLOSED,
                    operation_status=ClientOperation.OperationStatus.ACCEPTED,
                    created_by=admin,
                    cnpj=REJECTED_PROPOSAL_CNPJ,
                    name="Cliente Reconquista Teste",
                    email="reconquista@example.com",
                    phone="51991000310",
                    address="Rua Teste, 100",
                    state="SP",
                    city="São Paulo",
                    is_active=True,
                )
            if not winback_client.users.filter(cpf=CPF_COMERCIAL).exists():
                winback_client.users.add(comercial)

            Proposal.objects.create(
                cnpj=REJECTED_PROPOSAL_CNPJ,
                city="São Paulo",
                state="SP",
                contact_name="Contato Reconquista Teste",
                contact_phone="51991000303",
                email="winback@example.com",
                date=threshold_date,
                value=30000.00,
                contract_type=Proposal.ContractType.ANNUAL,
                status=Proposal.Status.REJECTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )

            # One ACCEPTED proposal per named registered client (for their fixture data).
            statuses = [
                Proposal.Status.ACCEPTED,
                Proposal.Status.REJECTED,
                Proposal.Status.PENDING,
            ]
            named_clients = [
                (
                    ClientOperation.objects.get(cnpj=REGISTERED_CNPJ),
                    "Porto Alegre",
                    "RS",
                    "contato@hcpa.edu.br",
                ),
                (
                    ClientOperation.objects.get(cnpj="90217758000179"),
                    "Porto Alegre",
                    "RS",
                    "contato@santacasa.tche.br",
                ),
                (
                    ClientOperation.objects.get(cnpj="57428412000144"),
                    "Porto Alegre",
                    "RS",
                    "contato@ghc.br",
                ),
                (
                    ClientOperation.objects.get(cnpj=CLIENT_SAO_LUCAS_CNPJ),
                    "Porto Alegre",
                    "RS",
                    "contato@saolucas.br",
                ),
            ]
            approved_cnpjs = [APPROVED_PROPOSAL_CNPJ]
            for i, (client, city, state, email) in enumerate(named_clients):
                status = statuses[i % len(statuses)]
                Proposal.objects.create(
                    cnpj=client.cnpj,
                    city=city,
                    state=state,
                    contact_name=f"Contato {client.name}",
                    contact_phone=f"5199100030{4 + i}",
                    email=email,
                    date=date(2024, 6, 1),
                    value=60000.00,
                    contract_type=Proposal.ContractType.ANNUAL,
                    status=Proposal.Status.ACCEPTED,
                    pdf_version=pdf_file,
                    word_version=word_file,
                )
                if status == Proposal.Status.ACCEPTED:
                    approved_cnpjs.append(client.cnpj)

        return approved_cnpjs

    # ---------------------------------------- pending-appointment scenarios

    def _seed_pending_appointment_scenarios(self) -> None:
        admin = UserAccount.objects.get(cpf=CPF_ADMIN)
        proposal_date = date.today() - timedelta(days=30)

        pending_client = ClientOperation.objects.filter(
            cnpj=PENDING_APPOINTMENT_CNPJ
        ).first()
        if pending_client is None:
            pending_client = ClientOperation.objects.create(
                operation_type=ClientOperation.OperationType.CLOSED,
                operation_status=ClientOperation.OperationStatus.ACCEPTED,
                created_by=admin,
                cnpj=PENDING_APPOINTMENT_CNPJ,
                name="Cliente E2E - Agendamento pendente",
                email="e2e-pending@example.com",
                phone=PHONE_E2E_PENDING,
                address="Rua E2E, 100",
                state="RS",
                city="Porto Alegre",
                is_active=True,
            )

        compliant_client = ClientOperation.objects.filter(
            cnpj=COMPLIANT_APPOINTMENT_CNPJ
        ).first()
        if compliant_client is None:
            compliant_client = ClientOperation.objects.create(
                operation_type=ClientOperation.OperationType.CLOSED,
                operation_status=ClientOperation.OperationStatus.ACCEPTED,
                created_by=admin,
                cnpj=COMPLIANT_APPOINTMENT_CNPJ,
                name="Cliente E2E - Agendamento em dia",
                email="e2e-compliant@example.com",
                phone=PHONE_E2E_COMPLIANT,
                address="Rua E2E, 200",
                state="RS",
                city="Porto Alegre",
                is_active=True,
            )

        pending_unit, _ = UnitOperation.objects.get_or_create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            client=pending_client.client_ptr,
            defaults={
                "name": "Unidade E2E - pendente",
                "cnpj": "77556644000195",
                "email": "unidade.e2e.pending@example.com",
                "phone": "51991000120",
                "address": "Rua Unidade E2E, 10",
                "state": pending_client.state,
                "city": pending_client.city,
            },
        )

        compliant_unit, _ = UnitOperation.objects.get_or_create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin,
            client=compliant_client.client_ptr,
            defaults={
                "name": "Unidade E2E - em dia",
                "cnpj": "99888776000157",
                "email": "unidade.e2e.compliant@example.com",
                "phone": "51991000121",
                "address": "Rua Unidade E2E, 20",
                "state": compliant_client.state,
                "city": compliant_client.city,
            },
        )

        Proposal.objects.update_or_create(
            cnpj=pending_client.cnpj,
            date=proposal_date,
            defaults={
                "city": pending_client.city,
                "state": pending_client.state,
                "contact_name": "Contato E2E",
                "contact_phone": "51991000130",
                "email": "proposal.pending@example.com",
                "value": 10000.00,
                "contract_type": Proposal.ContractType.ANNUAL,
                "status": Proposal.Status.ACCEPTED,
            },
        )

        Proposal.objects.update_or_create(
            cnpj=compliant_client.cnpj,
            date=proposal_date,
            defaults={
                "city": compliant_client.city,
                "state": compliant_client.state,
                "contact_name": "Contato E2E",
                "contact_phone": "51991000131",
                "email": "proposal.compliant@example.com",
                "value": 10000.00,
                "contract_type": Proposal.ContractType.ANNUAL,
                "status": Proposal.Status.ACCEPTED,
            },
        )

        Appointment.objects.get_or_create(
            unit=compliant_unit.unit_ptr,
            date=timezone.now() + timedelta(days=7),
            defaults={
                "status": Appointment.Status.CONFIRMED,
                "type": Appointment.Type.IN_PERSON,
                "justification": None,
                "contact_phone": "51991000140",
                "contact_name": "Contato E2E",
                "service_order": None,
            },
        )

    # --------------------------------------------------------------- materials

    def _seed_materials(self) -> None:
        public_defs = [
            (
                InstitutionalMaterial.PublicCategory.SIGNS,
                "Sinalizações de Segurança – Porto Alegre",
                "Procedimentos de sinalização de áreas de risco em instalações médicas.",
            ),
            (
                InstitutionalMaterial.PublicCategory.TEAM_IO,
                "IOE – Procedimentos Gerais",
                "Instruções operacionais para equipes de saúde ocupacional.",
            ),
            (
                InstitutionalMaterial.PublicCategory.TERMS,
                "Termos de Consentimento – RS",
                "Modelos de termos de consentimento informado para pacientes.",
            ),
            (
                InstitutionalMaterial.PublicCategory.POPS,
                "POP – Controle de Qualidade",
                "Procedimentos operacionais padrão para controle de qualidade.",
            ),
            (
                InstitutionalMaterial.PublicCategory.LAW,
                "Legislação Vigente – RS",
                "Compilação das normas regulatórias aplicáveis às instalações.",
            ),
            (
                InstitutionalMaterial.PublicCategory.GUIDES,
                "Guia de Atendimento – Porto Alegre",
                "Guia de boas práticas de atendimento ao paciente.",
            ),
            (
                InstitutionalMaterial.PublicCategory.MANUALS,
                "Manual do Colaborador – Porto Alegre",
                "Manual de integração e conduta para novos colaboradores.",
            ),
            (
                InstitutionalMaterial.PublicCategory.OTHERS,
                "Orientações Gerais – Porto Alegre",
                "Orientações gerais sobre segurança e procedimentos.",
            ),
        ]

        for cat, title, description in public_defs:
            InstitutionalMaterial.objects.create(
                title=title,
                description=description,
                visibility=InstitutionalMaterial.Visibility.PUBLIC,
                category=cat,
                file=self._make_material_file(title),
            )

        internal_defs = [
            (
                InstitutionalMaterial.InternalCategory.TEAM_IO,
                "IOE – Rotinas Internas – Porto Alegre",
                "Instruções operacionais para rotinas internas da equipe.",
            ),
            (
                InstitutionalMaterial.InternalCategory.POPS,
                "POP – Verificações Internas",
                "Procedimentos operacionais para verificações internas de qualidade.",
            ),
            (
                InstitutionalMaterial.InternalCategory.GUIDES,
                "Guia Interno – Operações",
                "Guia interno de processos e operações da empresa.",
            ),
            (
                InstitutionalMaterial.InternalCategory.MANUALS,
                "Manual Interno – RS",
                "Manual interno de procedimentos para a região Sul.",
            ),
            (
                InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
                "Modelo de Relatório – Porto Alegre",
                "Modelos padronizados de relatório técnico.",
            ),
            (
                InstitutionalMaterial.InternalCategory.DOC_TEMPLATES,
                "Modelo de Documento – RS",
                "Modelos de documentos internos para uso da equipe.",
            ),
        ]

        for cat, title, description in internal_defs:
            InstitutionalMaterial.objects.create(
                title=title,
                description=description,
                visibility=InstitutionalMaterial.Visibility.INTERNAL,
                category=cat,
                file=self._make_material_file(title),
            )

    def _make_material_file(self, title: str) -> ContentFile:
        from ._seed_common import safe_slug

        uid = uuid.uuid4().hex[:8]
        filename = f"material-{safe_slug(title)}-{uid}.txt"
        content = (
            f"Material Institucional: {title}\n"
            f"Arquivo gerado para testes Cypress.\n"
        )
        return ContentFile(content, name=filename)

    # --------------------------------------------------------------- fixtures

    def _write_fixtures(
        self,
        approved_cnpjs: list[str],
        users: dict,
        default_clients: dict,
        default_units: dict,
        default_equipments: dict,
    ) -> None:
        if not settings.EXPORT_CYPRESS_FIXTURES:
            return

        import os

        os.makedirs(FIXTURE_PATH, exist_ok=True)

        fixture_data_map = [
            (
                {
                    "approved_cnpjs": approved_cnpjs,
                    "rejected_cnpj": REJECTED_PROPOSAL_CNPJ,
                },
                "proposals.json",
            ),
            (users, "users.json"),
            ({"registered_cnpj": REGISTERED_CNPJ}, "registered-client.json"),
            (
                {"eligible_registration_cnpj": ELIGIBLE_REGISTRATION_CNPJ},
                "eligible-registration.json",
            ),
            ({"no_proposal_cnpj": NO_PROPOSAL_CNPJ}, "no-proposal.json"),
            (default_clients, "default-clients.json"),
            (default_units, "default-units.json"),
            (default_equipments, "default-equipments.json"),
            (
                {
                    "pending_cnpj": PENDING_APPOINTMENT_CNPJ,
                    "compliant_cnpj": COMPLIANT_APPOINTMENT_CNPJ,
                },
                "pending-appointment.json",
            ),
        ]

        for data, filename in fixture_data_map:
            file_path = create_fixture_path(filename)
            write_json_file(data=data, file_path=file_path)
