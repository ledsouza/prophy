"use client";

import { useMemo } from "react";

import { EquipmentList } from "@/components/client";
import { Button } from "@/components/common";
import { Input } from "@/components/forms";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import Role from "@/enums/Role";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";
import clsx from "clsx";

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

/**
 * EquipmentPanel
 * Presentation-only content meant to be rendered inside a parent container
 * (e.g., TabbedResourcePanel). It renders a title, optional search input,
 * a scrollable list of equipments, and a bottom action button.
 *
 * Layout notes
 * - The root uses flex-col h-full and min-h-0 so the internal list can scroll when
 *   used inside a fixed-height flex parent.
 * - The list is wrapped in a flex-1 overflow-y-auto container; the bottom button remains visible.
 *
 * Params
 * @param {EquipmentDTO[]} filteredEquipmentsByUnit List of equipments for the current unit.
 * @param {string} searchTerm Current search term used to filter by model.
 * @param {(value: string) => void} onSearchTermChange Handler to update the search term.
 * @param {() => void} onAddEquipment Callback invoked when clicking the add button.
 * @param {string} [title="Equipamentos"] Panel title.
 * @param {string} [searchPlaceholder="Buscar equipamentos por modelo"] Search input placeholder.
 * @param {boolean} [showSearchWhenEmpty=false] If true, forces the search input to appear even when the list is empty.
 * @param {string} [searchInputDataTestId="input-search-equipments"] data-testid applied to the search input.
 * @param {string} [addButtonDataTestId="btn-add-equipment"] data-testid applied to the add button.
 * @param {string} [containerClassName] Extra class names appended to the outer container.
 *
 * Behavior/Notes
 * - Filters equipments by model (case-insensitive) using a memoized computation.
 * - Search input is shown when there is any equipment or when showSearchWhenEmpty is true.
 * - EquipmentList receives both the computed searchedEquipments and the original filteredEquipmentsByUnit.
 */
const EquipmentPanel = ({
    filteredEquipmentsByUnit = [],
    searchTerm,
    onSearchTermChange,
    onAddEquipment,
    searchPlaceholder = "Buscar equipamentos por modelo",
    showSearchWhenEmpty = false,
    searchInputDataTestId = "input-search-equipments",
    addButtonDataTestId = "btn-add-equipment",
    containerClassName = "",
}: EquipmentPanelProps) => {
    const { data: userData } = useRetrieveUserQuery();
    const isCommercial = userData?.role === Role.C;
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
        <div className={clsx("flex flex-col gap-6 h-full min-h-0", containerClassName)}>
            {showSearch && (
                <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    aria-label={searchPlaceholder}
                    dataTestId={searchInputDataTestId}
                />
            )}

            <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pr-2">
                <EquipmentList
                    searchedEquipments={searchedEquipments}
                    filteredEquipmentsByUnit={filteredEquipmentsByUnit}
                />
            </div>

            {!isCommercial && (
                <Button onClick={onAddEquipment} data-testid={addButtonDataTestId}>
                    Adicionar equipamento
                </Button>
            )}
        </div>
    );
};

export default EquipmentPanel;
