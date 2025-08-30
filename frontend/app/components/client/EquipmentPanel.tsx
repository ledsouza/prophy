"use client";

import { useMemo } from "react";

import { EquipmentList } from "@/components/client";
import { Button } from "@/components/common";
import { Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";

type EquipmentPanelProps = {
    filteredEquipmentsByUnit: EquipmentDTO[];
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    onAddEquipment: () => void;
    title?: string;
    searchPlaceholder?: string;
    showSearchWhenEmpty?: boolean;
    searchInputDataTestId?: string;
    addButtonDataTestId?: string;
    containerClassName?: string;
};

const EquipmentPanel = ({
    filteredEquipmentsByUnit = [],
    searchTerm,
    onSearchTermChange,
    onAddEquipment,
    title = "Equipamentos",
    searchPlaceholder = "Buscar equipamentos por modelo",
    showSearchWhenEmpty = false,
    searchInputDataTestId = "input-search-equipments",
    addButtonDataTestId = "btn-add-equipment",
    containerClassName = "",
}: EquipmentPanelProps) => {
    const searchedEquipments = useMemo(() => {
        if (!Array.isArray(filteredEquipmentsByUnit) || filteredEquipmentsByUnit.length === 0) {
            return [];
        }
        const term = (searchTerm || "").trim().toLowerCase();
        if (!term) return filteredEquipmentsByUnit;
        return filteredEquipmentsByUnit.filter((e) => e.model?.toLowerCase().includes(term));
    }, [filteredEquipmentsByUnit, searchTerm]);

    const showSearch = showSearchWhenEmpty || filteredEquipmentsByUnit.length > 0;

    return (
        <div
            className={`w-full md:w-2/3 h-[60vh] md:h-[80vh] overflow-y-auto flex flex-col gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8 ${containerClassName}`}
        >
            <Typography element="h2" size="title2" className="font-bold">
                {title}
            </Typography>

            {showSearch && (
                <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    aria-label={searchPlaceholder}
                    dataTestId={searchInputDataTestId}
                />
            )}

            <EquipmentList
                searchedEquipments={searchedEquipments}
                filteredEquipmentsByUnit={filteredEquipmentsByUnit}
            />

            <Button onClick={onAddEquipment} data-testid={addButtonDataTestId}>
                Adicionar equipamento
            </Button>
        </div>
    );
};

export default EquipmentPanel;
