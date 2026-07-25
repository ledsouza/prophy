"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    TabGroup,
    TabPanel,
    TabPanels,
} from "@headlessui/react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";
import { useGetAccessoriesQuery } from "@/redux/features/accessoryApiSlice";
import { useListReportsQuery } from "@/redux/features/reportApiSlice";
import { AccessoryType } from "@/redux/features/modalityApiSlice";

import notFound from "@/assets/image-not-found.png";
import {
    CaretDownIcon,
    MagnifyingGlassPlusIcon,
    XCircleIcon,
} from "@phosphor-icons/react";

import { Tab, TabList } from "@/components/common";
import { resolveMediaPath } from "@/utils/url";
import { Typography } from "@/components/foundation";
import { EquipmentReportsTab } from "@/components/client";

const ImageLightbox = dynamic(() => import("@/components/common/ImageLightbox"), {
    ssr: false,
});

const ZOOM_BADGE_CLASSNAME =
    "pointer-events-none absolute bottom-2 right-2 flex items-center justify-center rounded-full bg-black/60 p-1.5";
const ZOOM_BADGE_CLASSNAME_SMALL =
    "pointer-events-none absolute bottom-1 right-1 flex items-center justify-center rounded-full bg-black/60 p-1";

type EquipmentDetailsProps = {
    equipment: EquipmentDTO;
    onClose: () => void;
};

function buildImageSrc(pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) {
        return "";
    }

    return resolveMediaPath(pathOrUrl);
}

function shouldDisableOptimization(src: string): boolean {
    if (src.startsWith("http://") || src.startsWith("https://")) {
        return true;
    }

    // These paths redirect (302) to the actual media file, which Next's
    // built-in image optimizer cannot resolve server-side when the
    // request is relative, so serve the browser the redirect directly.
    return src.startsWith("/media/") || src.startsWith("/api/");
}

function EquipmentDetails({ equipment, onClose }: EquipmentDetailsProps) {
    const { data: accessories = [] } = useGetAccessoriesQuery();
    const equipmentAccessories = accessories.filter(
        (accessory) => accessory.equipment === equipment.id,
    );

    const { data: reports = [] } = useListReportsQuery({ equipment: equipment.id });

    const formattedDate = equipment.purchase_installation_date
        ? format(parseISO(equipment.purchase_installation_date), "dd/MM/yyyy", { locale: ptBR })
        : "Não informado";

    const equipmentPhotoSrc = equipment.equipment_photo
        ? buildImageSrc(equipment.equipment_photo)
        : notFound;

    const slides = useMemo(() => {
        const items: { key: string; src: string; alt: string }[] = [];

        if (equipment.equipment_photo) {
            items.push({
                key: "equipment-photo",
                src: buildImageSrc(equipment.equipment_photo),
                alt: "Imagem do equipamento",
            });
        }
        if (equipment.label_photo) {
            items.push({
                key: "equipment-label",
                src: buildImageSrc(equipment.label_photo),
                alt: "Rótulo do equipamento",
            });
        }
        equipmentAccessories.forEach((accessory) => {
            if (accessory.equipment_photo) {
                items.push({
                    key: `accessory-photo-${accessory.id}`,
                    src: buildImageSrc(accessory.equipment_photo),
                    alt: `Acessório ${accessory.model}`,
                });
            }
            if (accessory.label_photo) {
                items.push({
                    key: `accessory-label-${accessory.id}`,
                    src: buildImageSrc(accessory.label_photo),
                    alt: `Rótulo do acessório ${accessory.model}`,
                });
            }
        });

        return items;
    }, [equipment.equipment_photo, equipment.label_photo, equipmentAccessories]);

    const slideIndexByKey = useMemo(
        () => new Map(slides.map((slide, i) => [slide.key, i])),
        [slides],
    );

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    function openLightbox(key: string) {
        const i = slideIndexByKey.get(key);
        if (i !== undefined) {
            setLightboxIndex(i);
        }
    }

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
                    <button
                        type="button"
                        onClick={() => openLightbox("equipment-photo")}
                        className="group relative block h-full w-full cursor-zoom-in disabled:cursor-default"
                        aria-label="Ampliar imagem do equipamento"
                        data-cy="equipment-photo-zoom-trigger"
                        disabled={!equipment.equipment_photo}
                    >
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
                        {equipment.equipment_photo && (
                            <>
                                <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                <span className={ZOOM_BADGE_CLASSNAME}>
                                    <MagnifyingGlassPlusIcon
                                        size={20}
                                        className="text-white"
                                        weight="bold"
                                    />
                                </span>
                            </>
                        )}
                    </button>
                </div>

                <div className="m-6">
                    <TabGroup>
                        <TabList className="mb-0">
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
                                            <button
                                                type="button"
                                                onClick={() => openLightbox("equipment-label")}
                                                className="group relative inline-block h-50 w-50 cursor-zoom-in"
                                                aria-label="Ampliar rótulo do equipamento"
                                                data-cy="equipment-label-photo-zoom-trigger"
                                            >
                                                <Image
                                                    src={
                                                        buildImageSrc(equipment.label_photo) ||
                                                        notFound
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
                                                <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                                <span className={ZOOM_BADGE_CLASSNAME}>
                                                    <MagnifyingGlassPlusIcon
                                                        size={20}
                                                        className="text-white"
                                                        weight="bold"
                                                    />
                                                </span>
                                            </button>
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
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openLightbox(
                                                                    `accessory-photo-${accessory.id}`,
                                                                )
                                                            }
                                                            className="group relative h-20 w-20 shrink-0 cursor-zoom-in"
                                                            aria-label={`Ampliar imagem do acessório ${accessory.model}`}
                                                            data-cy={`accessory-photo-zoom-trigger-${accessory.id}`}
                                                        >
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
                                                            <span className="pointer-events-none absolute inset-0 rounded-md bg-black/0 transition-colors group-hover:bg-black/10" />
                                                            <span className={ZOOM_BADGE_CLASSNAME_SMALL}>
                                                                <MagnifyingGlassPlusIcon
                                                                    size={12}
                                                                    className="text-white"
                                                                    weight="bold"
                                                                />
                                                            </span>
                                                        </button>
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
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openLightbox(
                                                                    `accessory-label-${accessory.id}`,
                                                                )
                                                            }
                                                            className="group relative inline-block h-25 w-25 cursor-zoom-in"
                                                            aria-label={`Ampliar rótulo do acessório ${accessory.model}`}
                                                            data-cy={`accessory-label-photo-zoom-trigger-${accessory.id}`}
                                                        >
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
                                                            <span className="pointer-events-none absolute inset-0 rounded-md bg-black/0 transition-colors group-hover:bg-black/10" />
                                                            <span className={ZOOM_BADGE_CLASSNAME_SMALL}>
                                                                <MagnifyingGlassPlusIcon
                                                                    size={12}
                                                                    className="text-white"
                                                                    weight="bold"
                                                                />
                                                            </span>
                                                        </button>
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
                    <button
                        type="button"
                        onClick={() => openLightbox("equipment-photo")}
                        className="group relative block h-full w-full cursor-zoom-in disabled:cursor-default"
                        aria-label="Ampliar imagem do equipamento"
                        data-cy="equipment-photo-zoom-trigger"
                        disabled={!equipment.equipment_photo}
                    >
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
                        {equipment.equipment_photo && (
                            <span className={ZOOM_BADGE_CLASSNAME}>
                                <MagnifyingGlassPlusIcon
                                    size={20}
                                    className="text-white"
                                    weight="bold"
                                />
                            </span>
                        )}
                    </button>
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
                                            <button
                                                type="button"
                                                onClick={() => openLightbox("equipment-label")}
                                                className="group relative block w-full cursor-zoom-in"
                                                aria-label="Ampliar rótulo do equipamento"
                                                data-cy="equipment-label-photo-zoom-trigger"
                                            >
                                                <Image
                                                    src={
                                                        buildImageSrc(equipment.label_photo) ||
                                                        notFound
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
                                                <span className={ZOOM_BADGE_CLASSNAME}>
                                                    <MagnifyingGlassPlusIcon
                                                        size={20}
                                                        className="text-white"
                                                        weight="bold"
                                                    />
                                                </span>
                                            </button>
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
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openLightbox(
                                                                        `accessory-photo-${accessory.id}`,
                                                                    )
                                                                }
                                                                className="group relative h-16 w-16 shrink-0 cursor-zoom-in"
                                                                aria-label={`Ampliar imagem do acessório ${accessory.model}`}
                                                                data-cy={`accessory-photo-zoom-trigger-${accessory.id}`}
                                                            >
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
                                                                <span className={ZOOM_BADGE_CLASSNAME_SMALL}>
                                                                    <MagnifyingGlassPlusIcon
                                                                        size={12}
                                                                        className="text-white"
                                                                        weight="bold"
                                                                    />
                                                                </span>
                                                            </button>
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
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openLightbox(
                                                                        `accessory-label-${accessory.id}`,
                                                                    )
                                                                }
                                                                className="group relative block w-full cursor-zoom-in"
                                                                aria-label={`Ampliar rótulo do acessório ${accessory.model}`}
                                                                data-cy={`accessory-label-photo-zoom-trigger-${accessory.id}`}
                                                            >
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
                                                                <span className={ZOOM_BADGE_CLASSNAME}>
                                                                    <MagnifyingGlassPlusIcon
                                                                        size={16}
                                                                        className="text-white"
                                                                        weight="bold"
                                                                    />
                                                                </span>
                                                            </button>
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

            <ImageLightbox
                slides={slides}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
            />
        </div>
    );
}

export default EquipmentDetails;
