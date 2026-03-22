import Image from "next/image";
import type { ReactNode } from "react";

import type { ClientDTO } from "@/types/client";
import type { EquipmentDTO, EquipmentOperationDTO } from "@/redux/features/equipmentApiSlice";
import type { UnitDTO } from "@/redux/features/unitApiSlice";

import type { ReviewDiffField } from "./ReviewEditDiff";

type DiffFieldConfig<T> = {
    id: string;
    label: string;
    getValue: (entity: T) => string | number | undefined | null;
    multiline?: boolean;
    getPreview?: (entity: T) => ReactNode;
};

const toDisplayValue = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
};

const buildDiffFields = <T,>(
    currentEntity: T,
    proposedEntity: T,
    configs: DiffFieldConfig<T>[],
): ReviewDiffField[] => {
    return configs.map((config) => ({
        id: config.id,
        label: config.label,
        currentValue: toDisplayValue(config.getValue(currentEntity)),
        proposedValue: toDisplayValue(config.getValue(proposedEntity)),
        multiline: config.multiline,
        currentPreview: config.getPreview?.(currentEntity),
        proposedPreview: config.getPreview?.(proposedEntity),
    }));
};

const imagePreview = (src?: string, alt?: string): ReactNode => {
    if (!src) {
        return <span className="text-sm text-text-secondary">Nenhuma imagem enviada.</span>;
    }

    return (
        <div className="flex flex-col gap-3">
            <TypographyLabel>{alt}</TypographyLabel>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <Image
                    src={process.env.NEXT_PUBLIC_HOST + src}
                    alt={alt ?? "Imagem do equipamento"}
                    width={480}
                    height={240}
                    className="h-48 w-full object-contain bg-white"
                />
            </div>
        </div>
    );
};

const TypographyLabel = ({ children }: { children: ReactNode }) => (
    <span className="text-sm font-medium text-text-secondary">{children}</span>
);

const clientFieldConfigs: DiffFieldConfig<ClientDTO>[] = [
    { id: "name", label: "Nome", getValue: (client) => client.name },
    { id: "email", label: "E-mail", getValue: (client) => client.email },
    { id: "phone", label: "Telefone", getValue: (client) => client.phone },
    { id: "state", label: "Estado", getValue: (client) => client.state },
    { id: "city", label: "Cidade", getValue: (client) => client.city },
    {
        id: "address",
        label: "Endereço",
        getValue: (client) => client.address,
        multiline: true,
    },
];

const unitFieldConfigs: DiffFieldConfig<UnitDTO>[] = [
    { id: "name", label: "Nome", getValue: (unit) => unit.name },
    { id: "cnpj", label: "CNPJ", getValue: (unit) => unit.cnpj },
    { id: "email", label: "E-mail", getValue: (unit) => unit.email },
    { id: "phone", label: "Telefone", getValue: (unit) => unit.phone },
    { id: "state", label: "Estado", getValue: (unit) => unit.state },
    { id: "city", label: "Cidade", getValue: (unit) => unit.city },
    {
        id: "address",
        label: "Endereço",
        getValue: (unit) => unit.address,
        multiline: true,
    },
];

const equipmentFieldConfigs: DiffFieldConfig<EquipmentDTO | EquipmentOperationDTO>[] = [
    {
        id: "modality",
        label: "Modalidade",
        getValue: (equipment) => equipment.modality?.name,
    },
    {
        id: "manufacturer",
        label: "Fabricante",
        getValue: (equipment) => equipment.manufacturer,
    },
    { id: "model", label: "Modelo", getValue: (equipment) => equipment.model },
    {
        id: "series_number",
        label: "Número de série",
        getValue: (equipment) => equipment.series_number,
    },
    {
        id: "anvisa_registry",
        label: "Registro na ANVISA",
        getValue: (equipment) => equipment.anvisa_registry,
    },
    {
        id: "equipment_photo",
        label: "Foto do equipamento",
        getValue: (equipment) => equipment.equipment_photo ? "Imagem atualizada" : "Sem imagem",
        getPreview: (equipment) => imagePreview(equipment.equipment_photo, "Foto do equipamento"),
    },
    {
        id: "label_photo",
        label: "Foto do rótulo do equipamento",
        getValue: (equipment) => equipment.label_photo ? "Imagem atualizada" : "Sem imagem",
        getPreview: (equipment) =>
            imagePreview(equipment.label_photo, "Foto do rótulo do equipamento"),
    },
];

const getClientReviewDiffFields = (
    currentClient: ClientDTO,
    proposedClient: ClientDTO,
): ReviewDiffField[] => buildDiffFields(currentClient, proposedClient, clientFieldConfigs);

const getUnitReviewDiffFields = (
    currentUnit: UnitDTO,
    proposedUnit: UnitDTO,
): ReviewDiffField[] => buildDiffFields(currentUnit, proposedUnit, unitFieldConfigs);

const getEquipmentReviewDiffFields = (
    currentEquipment: EquipmentDTO,
    proposedEquipment: EquipmentOperationDTO,
): ReviewDiffField[] =>
    buildDiffFields(currentEquipment, proposedEquipment, equipmentFieldConfigs);

export {
    getClientReviewDiffFields,
    getEquipmentReviewDiffFields,
    getUnitReviewDiffFields,
};