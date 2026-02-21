import Image from "next/image";
import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    TabGroup,
    TabList,
    TabPanel,
    TabPanels,
} from "@headlessui/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";
import { useGetAccessoriesQuery } from "@/redux/features/accessoryApiSlice";
import { useListReportsQuery } from "@/redux/features/reportApiSlice";
import { AccessoryType } from "@/redux/features/modalityApiSlice";

import notFound from "@/assets/image-not-found.png";
import { CaretDownIcon, XCircleIcon } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import { Tab } from "@/components/common";
import { EquipmentReportsTab } from "@/components/client";

type EquipmentDetailsProps = {
    equipment: EquipmentDTO;
    onClose: () => void;
};

function buildImageSrc(pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) {
        return "";
    }

    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return pathOrUrl;
    }

    const host = process.env.NEXT_PUBLIC_HOST ?? "";
    if (!host) {
        return pathOrUrl;
    }

    return `${host.replace(/\/$/, "")}/${pathOrUrl.replace(/^\//, "")}`;
}

function shouldDisableOptimization(src: string): boolean {
    const host = process.env.NEXT_PUBLIC_HOST;
    if (!host) {
        return false;
    }

    return src.startsWith(host);
}

function EquipmentDetails({ equipment, onClose }: EquipmentDetailsProps) {
    const { data: accessories = [] } = useGetAccessoriesQuery();
    const equipmentAccessories = accessories.filter(
        (accessory) => accessory.equipment === equipment.id,
    );

    const { data: reports = [] } = useListReportsQuery({ equipment: equipment.id });

    const formattedDate = equipment.purchase_installation_date
        ? format(new Date(equipment.purchase_installation_date), "dd/MM/yyyy", { locale: ptBR })
        : "Não informado";

    const equipmentPhotoSrc = equipment.equipment_photo
        ? buildImageSrc(equipment.equipment_photo)
        : notFound;

    return (
        <div className="flex flex-col" data-testid="equipment-details">
            <div className="hidden sm:block">
                <button
                    onClick={onClose}
                    className="absolute right-1 top-1 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    data-testid="btn-close-modal"
                    aria-label="Fechar modal"
                >
                    <XCircleIcon size={32} className="text-primary" />
                </button>

                <div className="relative w-full h-100">
                    <Image
                        src={equipmentPhotoSrc}
                        alt="Imagem do equipamento"
                        fill
                        className="shadow-lg ring-2"
                        unoptimized={
                            typeof equipmentPhotoSrc === "string" &&
                            shouldDisableOptimization(equipmentPhotoSrc)
                        }
                        style={{ objectFit: "contain" }}
                    />
                </div>

                <div className="m-6">
                    <TabGroup>
                        <TabList className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                            <Tab>Informações Gerais</Tab>
                            <Tab>Especificações Técnicas</Tab>
                            <Tab>Manutenção</Tab>
                            <Tab>Acessórios ({equipmentAccessories.length})</Tab>
                            <Tab>Relatórios ({reports.length})</Tab>
                        </TabList>

                        <TabPanels className="mt-4">
                            <TabPanel className="rounded-xl bg-white p-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Typography
                                            element="h3"
                                            size="lg"
                                            className="font-semibold mb-2"
                                        >
                                            Informações do Equipamento
                                        </Typography>
                                        <Typography size="md">
                                            <b>Modelo:</b> {equipment.model}
                                            <br />
                                            <b>Fabricante:</b> {equipment.manufacturer}
                                            <br />
                                            <b>Modalidade:</b> {equipment.modality.name}
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography
                                            element="h3"
                                            size="lg"
                                            className="font-semibold mb-2"
                                        >
                                            Registro
                                        </Typography>
                                        <Typography size="md">
                                            <b>Número de Série:</b>{" "}
                                            {equipment.series_number || "Não informado"}
                                            <br />
                                            <b>Registro da Anvisa:</b>{" "}
                                            {equipment.anvisa_registry || "Não informado"}
                                        </Typography>
                                    </div>

                                    {equipment.label_photo && (
                                        <div className="col-span-1 md:col-span-2">
                                            <Typography
                                                element="h3"
                                                size="lg"
                                                className="font-semibold mb-2"
                                            >
                                                Rótulo
                                            </Typography>
                                            <Image
                                                src={
                                                    buildImageSrc(equipment.label_photo) || notFound
                                                }
                                                alt="Rótulo do equipamento"
                                                width={200}
                                                height={200}
                                                className="ring-1 shadow-md rounded-md"
                                                unoptimized={shouldDisableOptimization(
                                                    buildImageSrc(equipment.label_photo),
                                                )}
                                                style={{
                                                    objectFit: "contain",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabPanel>

                            <TabPanel className="rounded-xl bg-white p-3">
                                <Typography element="h3" size="lg" className="font-semibold mb-4">
                                    Especificações Técnicas
                                </Typography>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Typography size="md">
                                            <b>Canais:</b> {equipment.channels || "Não informado"}
                                            <br />
                                            <b>Carga Máxima Oficial:</b>{" "}
                                            {equipment.official_max_load
                                                ? `${equipment.official_max_load} kg`
                                                : "Não informado"}
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography size="md">
                                            <b>Carga Máxima Usual:</b>{" "}
                                            {equipment.usual_max_load
                                                ? `${equipment.usual_max_load} kg`
                                                : "Não informado"}
                                            <br />
                                            <b>Data de Compra/Instalação:</b> {formattedDate}
                                        </Typography>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel className="rounded-xl bg-white p-3">
                                <Typography element="h3" size="lg" className="font-semibold mb-4">
                                    Informações de Manutenção
                                </Typography>
                                <Typography size="md">
                                    <b>Responsável:</b>{" "}
                                    {equipment.maintenance_responsable || "Não informado"}
                                    <br />
                                    <b>Email:</b>{" "}
                                    {equipment.email_maintenance_responsable || "Não informado"}
                                    <br />
                                    <b>Telefone:</b>{" "}
                                    {equipment.phone_maintenance_responsable || "Não informado"}
                                </Typography>
                            </TabPanel>

                            <TabPanel className="rounded-xl bg-white p-3">
                                <Typography element="h3" size="lg" className="font-semibold mb-4">
                                    Acessórios
                                </Typography>

                                {equipmentAccessories.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {equipmentAccessories.map((accessory) => (
                                            <div
                                                key={accessory.id}
                                                className="border rounded-md p-4 shadow-sm"
                                            >
                                                <div className="flex gap-4">
                                                    {accessory.equipment_photo && (
                                                        <div className="relative w-20 h-20 shrink-0">
                                                            <Image
                                                                src={
                                                                    buildImageSrc(
                                                                        accessory.equipment_photo,
                                                                    ) || notFound
                                                                }
                                                                alt={`Acessório ${accessory.model}`}
                                                                fill={true}
                                                                className="rounded-md"
                                                                unoptimized={shouldDisableOptimization(
                                                                    buildImageSrc(
                                                                        accessory.equipment_photo,
                                                                    ),
                                                                )}
                                                                style={{ objectFit: "cover" }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Typography size="md" className="font-bold">
                                                            {accessory.model}
                                                        </Typography>
                                                        <Typography size="sm">
                                                            <b>Fabricante:</b>{" "}
                                                            {accessory.manufacturer}
                                                            <br />
                                                            <b>Número de Série:</b>{" "}
                                                            {accessory.series_number}
                                                            <br />
                                                            <b>Categoria:</b>{" "}
                                                            {accessory.category ===
                                                            AccessoryType.DETECTOR
                                                                ? "Detector"
                                                                : accessory.category ===
                                                                    AccessoryType.COIL
                                                                  ? "Bobina"
                                                                  : accessory.category ===
                                                                      AccessoryType.TRANSDUCER
                                                                    ? "Transdutor"
                                                                    : "Não especificado"}
                                                        </Typography>
                                                    </div>
                                                </div>

                                                {accessory.label_photo && (
                                                    <div className="mt-2">
                                                        <Typography
                                                            size="sm"
                                                            className="font-semibold mb-1"
                                                        >
                                                            Rótulo:
                                                        </Typography>
                                                        <Image
                                                            src={
                                                                buildImageSrc(
                                                                    accessory.label_photo,
                                                                ) || notFound
                                                            }
                                                            alt={`Rótulo do acessório ${accessory.model}`}
                                                            width={100}
                                                            height={100}
                                                            className="ring-1 shadow-sm rounded-md"
                                                            unoptimized={shouldDisableOptimization(
                                                                buildImageSrc(
                                                                    accessory.label_photo,
                                                                ),
                                                            )}
                                                            style={{ objectFit: "contain" }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Typography size="md">
                                        Nenhum acessório cadastrado para este equipamento.
                                    </Typography>
                                )}
                            </TabPanel>

                            <TabPanel className="rounded-xl bg-white p-3 h-125">
                                <EquipmentReportsTab equipmentId={equipment.id} />
                            </TabPanel>
                        </TabPanels>
                    </TabGroup>
                </div>
            </div>

            <div className="flex flex-col sm:hidden">
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                    <Typography element="h2" size="lg" className="font-semibold">
                        Detalhes do Equipamento
                    </Typography>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        data-testid="btn-close-modal"
                        aria-label="Fechar modal"
                    >
                        <XCircleIcon size={28} className="text-primary" />
                    </button>
                </div>

                <div className="relative w-full h-72">
                    <Image
                        src={equipmentPhotoSrc}
                        alt="Imagem do equipamento"
                        fill
                        className="shadow-lg ring-2"
                        unoptimized={
                            typeof equipmentPhotoSrc === "string" &&
                            shouldDisableOptimization(equipmentPhotoSrc)
                        }
                        style={{ objectFit: "contain" }}
                    />
                </div>

                <div className="space-y-3 px-4 py-6">
                    <Disclosure defaultOpen>
                        {({ open }) => (
                            <div className="rounded-xl bg-gray-100 p-1">
                                <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-left">
                                    <Typography size="md" className="font-semibold">
                                        Informações Gerais
                                    </Typography>
                                    <CaretDownIcon
                                        size={20}
                                        className={open ? "rotate-180" : "rotate-0"}
                                    />
                                </DisclosureButton>
                                <DisclosurePanel className="space-y-4 px-4 pb-4 pt-3">
                                    <div>
                                        <Typography
                                            element="h3"
                                            size="md"
                                            className="font-semibold mb-2"
                                        >
                                            Informações do Equipamento
                                        </Typography>
                                        <div className="space-y-1">
                                            <Typography size="sm">
                                                <b>Modelo:</b> {equipment.model}
                                            </Typography>
                                            <Typography size="sm">
                                                <b>Fabricante:</b> {equipment.manufacturer}
                                            </Typography>
                                            <Typography size="sm">
                                                <b>Modalidade:</b> {equipment.modality.name}
                                            </Typography>
                                        </div>
                                    </div>
                                    <div>
                                        <Typography
                                            element="h3"
                                            size="md"
                                            className="font-semibold mb-2"
                                        >
                                            Registro
                                        </Typography>
                                        <div className="space-y-1">
                                            <Typography size="sm">
                                                <b>Número de Série:</b>{" "}
                                                {equipment.series_number || "Não informado"}
                                            </Typography>
                                            <Typography size="sm">
                                                <b>Registro da Anvisa:</b>{" "}
                                                {equipment.anvisa_registry || "Não informado"}
                                            </Typography>
                                        </div>
                                    </div>
                                    {equipment.label_photo && (
                                        <div>
                                            <Typography
                                                element="h3"
                                                size="md"
                                                className="font-semibold mb-2"
                                            >
                                                Rótulo
                                            </Typography>
                                            <Image
                                                src={
                                                    buildImageSrc(equipment.label_photo) || notFound
                                                }
                                                alt="Rótulo do equipamento"
                                                width={420}
                                                height={300}
                                                className="w-full rounded-md ring-1 shadow-md"
                                                unoptimized={shouldDisableOptimization(
                                                    buildImageSrc(equipment.label_photo),
                                                )}
                                                style={{ objectFit: "contain" }}
                                            />
                                        </div>
                                    )}
                                </DisclosurePanel>
                            </div>
                        )}
                    </Disclosure>

                    <Disclosure>
                        {({ open }) => (
                            <div className="rounded-xl bg-gray-100 p-1">
                                <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-left">
                                    <Typography size="md" className="font-semibold">
                                        Especificações Técnicas
                                    </Typography>
                                    <CaretDownIcon
                                        size={20}
                                        className={open ? "rotate-180" : "rotate-0"}
                                    />
                                </DisclosureButton>
                                <DisclosurePanel className="space-y-3 px-4 pb-4 pt-3">
                                    <Typography size="sm">
                                        <b>Canais:</b> {equipment.channels || "Não informado"}
                                    </Typography>
                                    <Typography size="sm">
                                        <b>Carga Máxima Oficial:</b>{" "}
                                        {equipment.official_max_load
                                            ? `${equipment.official_max_load} kg`
                                            : "Não informado"}
                                    </Typography>
                                    <Typography size="sm">
                                        <b>Carga Máxima Usual:</b>{" "}
                                        {equipment.usual_max_load
                                            ? `${equipment.usual_max_load} kg`
                                            : "Não informado"}
                                    </Typography>
                                    <Typography size="sm">
                                        <b>Data de Compra/Instalação:</b> {formattedDate}
                                    </Typography>
                                </DisclosurePanel>
                            </div>
                        )}
                    </Disclosure>

                    <Disclosure>
                        {({ open }) => (
                            <div className="rounded-xl bg-gray-100 p-1">
                                <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-left">
                                    <Typography size="md" className="font-semibold">
                                        Manutenção
                                    </Typography>
                                    <CaretDownIcon
                                        size={20}
                                        className={open ? "rotate-180" : "rotate-0"}
                                    />
                                </DisclosureButton>
                                <DisclosurePanel className="space-y-3 px-4 pb-4 pt-3">
                                    <Typography size="sm">
                                        <b>Responsável:</b>{" "}
                                        {equipment.maintenance_responsable || "Não informado"}
                                    </Typography>
                                    <Typography size="sm">
                                        <b>Email:</b>{" "}
                                        {equipment.email_maintenance_responsable || "Não informado"}
                                    </Typography>
                                    <Typography size="sm">
                                        <b>Telefone:</b>{" "}
                                        {equipment.phone_maintenance_responsable || "Não informado"}
                                    </Typography>
                                </DisclosurePanel>
                            </div>
                        )}
                    </Disclosure>

                    <Disclosure>
                        {({ open }) => (
                            <div className="rounded-xl bg-gray-100 p-1">
                                <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-left">
                                    <Typography size="md" className="font-semibold">
                                        Acessórios ({equipmentAccessories.length})
                                    </Typography>
                                    <CaretDownIcon
                                        size={20}
                                        className={open ? "rotate-180" : "rotate-0"}
                                    />
                                </DisclosureButton>
                                <DisclosurePanel className="space-y-4 px-4 pb-4 pt-3">
                                    {equipmentAccessories.length > 0 ? (
                                        <div className="space-y-4">
                                            {equipmentAccessories.map((accessory) => (
                                                <div
                                                    key={accessory.id}
                                                    className="rounded-md border bg-white p-3 shadow-sm"
                                                >
                                                    <div className="flex gap-3">
                                                        {accessory.equipment_photo && (
                                                            <div className="relative h-16 w-16 shrink-0">
                                                                <Image
                                                                    src={
                                                                        buildImageSrc(
                                                                            accessory.equipment_photo,
                                                                        ) || notFound
                                                                    }
                                                                    alt={`Acessório ${accessory.model}`}
                                                                    fill
                                                                    className="rounded-md"
                                                                    unoptimized={shouldDisableOptimization(
                                                                        buildImageSrc(
                                                                            accessory.equipment_photo,
                                                                        ),
                                                                    )}
                                                                    style={{
                                                                        objectFit: "cover",
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="space-y-1">
                                                            <Typography
                                                                size="sm"
                                                                className="font-semibold"
                                                            >
                                                                {accessory.model}
                                                            </Typography>
                                                            <Typography size="sm">
                                                                <b>Fabricante:</b>{" "}
                                                                {accessory.manufacturer}
                                                            </Typography>
                                                            <Typography size="sm">
                                                                <b>Número de Série:</b>{" "}
                                                                {accessory.series_number}
                                                            </Typography>
                                                            <Typography size="sm">
                                                                <b>Categoria:</b>{" "}
                                                                {accessory.category ===
                                                                AccessoryType.DETECTOR
                                                                    ? "Detector"
                                                                    : accessory.category ===
                                                                        AccessoryType.COIL
                                                                      ? "Bobina"
                                                                      : accessory.category ===
                                                                          AccessoryType.TRANSDUCER
                                                                        ? "Transdutor"
                                                                        : "Não especificado"}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                    {accessory.label_photo && (
                                                        <div className="mt-3">
                                                            <Typography
                                                                size="sm"
                                                                className="font-semibold mb-1"
                                                            >
                                                                Rótulo:
                                                            </Typography>
                                                            <Image
                                                                src={
                                                                    buildImageSrc(
                                                                        accessory.label_photo,
                                                                    ) || notFound
                                                                }
                                                                alt={`Rótulo do acessório ${accessory.model}`}
                                                                width={220}
                                                                height={180}
                                                                className="w-full rounded-md ring-1 shadow-sm"
                                                                unoptimized={shouldDisableOptimization(
                                                                    buildImageSrc(
                                                                        accessory.label_photo,
                                                                    ),
                                                                )}
                                                                style={{
                                                                    objectFit: "contain",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Typography size="sm">
                                            Nenhum acessório cadastrado para este equipamento.
                                        </Typography>
                                    )}
                                </DisclosurePanel>
                            </div>
                        )}
                    </Disclosure>

                    <Disclosure>
                        {({ open }) => (
                            <div className="rounded-xl bg-gray-100 p-1">
                                <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-left">
                                    <Typography size="md" className="font-semibold">
                                        Relatórios ({reports.length})
                                    </Typography>
                                    <CaretDownIcon
                                        size={20}
                                        className={open ? "rotate-180" : "rotate-0"}
                                    />
                                </DisclosureButton>
                                <DisclosurePanel className="px-4 pb-4 pt-3">
                                    <EquipmentReportsTab equipmentId={equipment.id} />
                                </DisclosurePanel>
                            </div>
                        )}
                    </Disclosure>
                </div>
            </div>
        </div>
    );
}

export default EquipmentDetails;
