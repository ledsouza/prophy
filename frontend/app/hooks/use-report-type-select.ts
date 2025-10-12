import { useMemo, useState } from "react";
import { reportTypeLabel, type ReportTypeCode } from "@/types/report";
import type { SelectData } from "@/components/forms/Select";

const ALL_EQUIPMENT_ONLY_TYPES: ReportTypeCode[] = ["CQ", "TE", "LR"];
const ALL_UNIT_ONLY_TYPES: ReportTypeCode[] = ["CQM", "M", "TR", "TSR", "AD", "ID", "POP", "O"];

type UseReportTypeSelectParams = {
    isUnit: boolean;
    defaultIndex?: number;
};

type UseReportTypeSelectReturn = {
    options: SelectData[];
    selectedOption: SelectData;
    selectedReportTypeCode: ReportTypeCode;
    setSelect: (option: SelectData) => void;
};

/**
 * Custom hook to manage report type selection for Select components.
 *
 * Encapsulates the logic for filtering available report types based on
 * context (unit vs equipment), building Select options, and managing
 * selection state.
 *
 * @param isUnit - If true, returns unit-only report types; otherwise returns
 *   equipment-only types
 * @param defaultIndex - The initial selected index (defaults to 0)
 * @returns An object containing:
 *   - options: Array of SelectData for the Select component
 *   - selectedOption: The currently selected option
 *   - selectedReportTypeCode: The code of the selected report type
 *   - setSelect: Handler function to update selection
 *
 * @example
 * ```tsx
 * const { options, selectedOption, selectedReportTypeCode, setSelect } =
 *     useReportTypeSelect({ isUnit: true });
 *
 * <Select
 *     options={options}
 *     selectedData={selectedOption}
 *     setSelect={setSelect}
 * />
 * ```
 */
export const useReportTypeSelect = ({
    isUnit,
    defaultIndex = 0,
}: UseReportTypeSelectParams): UseReportTypeSelectReturn => {
    const availableCodes: ReportTypeCode[] = useMemo(
        () => (isUnit ? ALL_UNIT_ONLY_TYPES : ALL_EQUIPMENT_ONLY_TYPES),
        [isUnit]
    );

    const options = useMemo(
        () =>
            availableCodes.map((code, idx) => ({
                id: idx,
                value: reportTypeLabel[code] ?? code,
            })),
        [availableCodes]
    );

    const [selectedIndex, setSelectedIndex] = useState<number>(defaultIndex);

    const selectedOption = options[selectedIndex] ?? options[0];

    const selectedReportTypeCode = useMemo<ReportTypeCode>(
        () => availableCodes[selectedIndex] ?? availableCodes[0],
        [availableCodes, selectedIndex]
    );

    const setSelect = (option: SelectData) => {
        setSelectedIndex(option.id);
    };

    return {
        options,
        selectedOption,
        selectedReportTypeCode,
        setSelect,
    };
};
