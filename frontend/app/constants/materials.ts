import type { SelectData } from "@/components/forms/Select";
import type { MaterialCategoryCode, MaterialVisibility } from "@/types/material";

export const VISIBILITY_OPTIONS: (SelectData & { code?: MaterialVisibility })[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Público", code: "PUB" },
    { id: 2, value: "Interno", code: "INT" },
];

// Canonical source of truth for category metadata
type CategoryDef = {
    code: MaterialCategoryCode;
    label: string;
    visibilities: MaterialVisibility[]; // which visibilities expose this category
};

const CATEGORY_DEFS: CategoryDef[] = [
    { code: "SIG", label: "Sinalizações / Fluxogramas / Informativos", visibilities: ["PUB"] },
    { code: "IOE", label: "Instruções Operacionais de Equipe", visibilities: ["PUB", "INT"] },
    { code: "TER", label: "Termos", visibilities: ["PUB"] },
    { code: "POP", label: "POPs", visibilities: ["PUB", "INT"] },
    { code: "LEG", label: "Legislação Vigente", visibilities: ["PUB"] },
    { code: "GUI", label: "Guias", visibilities: ["PUB", "INT"] },
    { code: "MAN", label: "Manuais", visibilities: ["PUB", "INT"] },
    { code: "MRE", label: "Modelos de Relatórios", visibilities: ["INT"] },
    { code: "MDO", label: "Modelos de Documentos", visibilities: ["INT"] },
    { code: "IDV", label: "Material Institucional de Identidade Visual", visibilities: ["INT"] },
    { code: "OUT", label: "Outros", visibilities: ["PUB", "INT"] },
];

const PUBLIC_CATEGORY_ORDER: MaterialCategoryCode[] = [
    "SIG",
    "IOE",
    "TER",
    "POP",
    "LEG",
    "GUI",
    "MAN",
    "OUT",
];

const INTERNAL_CATEGORY_ORDER: MaterialCategoryCode[] = [
    "IOE",
    "POP",
    "GUI",
    "MAN",
    "MRE",
    "MDO",
    "IDV",
    "OUT",
];

const CATEGORY_LABEL_BY_CODE: Record<MaterialCategoryCode, string> = CATEGORY_DEFS.reduce(
    (acc, def) => {
        acc[def.code] = def.label;
        return acc;
    },
    {} as Record<MaterialCategoryCode, string>
);

const CATEGORY_VIS_BY_CODE: Record<
    MaterialCategoryCode,
    Set<MaterialVisibility>
> = CATEGORY_DEFS.reduce(
    (acc, def) => {
        acc[def.code] = new Set(def.visibilities);
        return acc;
    },
    {} as Record<MaterialCategoryCode, Set<MaterialVisibility>>
);

function toSelectOptions(
    visibility: MaterialVisibility
): (SelectData & { code: MaterialCategoryCode })[] {
    const order = visibility === "PUB" ? PUBLIC_CATEGORY_ORDER : INTERNAL_CATEGORY_ORDER;
    const baseId = visibility === "PUB" ? 101 : 201;

    const codes = order.filter((code) => CATEGORY_VIS_BY_CODE[code].has(visibility));

    return codes.map((code, idx) => ({
        id: baseId + idx,
        value: CATEGORY_LABEL_BY_CODE[code],
        code,
    }));
}

export const PUBLIC_CATEGORY_OPTIONS: (SelectData & { code: MaterialCategoryCode })[] =
    toSelectOptions("PUB");

export const INTERNAL_CATEGORY_OPTIONS: (SelectData & { code: MaterialCategoryCode })[] =
    toSelectOptions("INT");

export const getAllCategoryOptions = (): (SelectData & { code: MaterialCategoryCode })[] => {
    const publicFirst = PUBLIC_CATEGORY_ORDER;
    const internalOnlyRemainder = INTERNAL_CATEGORY_ORDER.filter((c) => !publicFirst.includes(c));
    const mergedOrder = [...publicFirst, ...internalOnlyRemainder];

    const OUT_CODE: MaterialCategoryCode = "OUT";

    let nextId = 1001;
    const seen = new Set<MaterialCategoryCode>();
    const out: (SelectData & { code: MaterialCategoryCode })[] = [];

    // Add all except OUT first, ensuring uniqueness by code
    for (const code of mergedOrder) {
        if (code === OUT_CODE) continue;
        if (seen.has(code)) continue;
        seen.add(code);
        out.push({ id: nextId++, value: CATEGORY_LABEL_BY_CODE[code], code });
    }

    // Append OUT at the very end if present in the merged order
    if (mergedOrder.includes(OUT_CODE) && !seen.has(OUT_CODE)) {
        seen.add(OUT_CODE);
        out.push({ id: nextId++, value: CATEGORY_LABEL_BY_CODE[OUT_CODE], code: OUT_CODE });
    }

    return out;
};

export const getCategoryLabel = (code: MaterialCategoryCode): string => {
    return CATEGORY_LABEL_BY_CODE[code] ?? code;
};

export const getVisibilityLabel = (code: MaterialVisibility): string => {
    switch (code) {
        case "PUB":
            return "Público";
        case "INT":
            return "Interno";
        default:
            return code;
    }
};

export const getCategoryOptionsForVisibility = (
    visibility?: MaterialVisibility
): (SelectData & { code?: MaterialCategoryCode })[] => {
    if (visibility === "PUB") return [{ id: 0, value: "Todos" }, ...PUBLIC_CATEGORY_OPTIONS];
    if (visibility === "INT") return [{ id: 0, value: "Todos" }, ...INTERNAL_CATEGORY_OPTIONS];
    return [{ id: 0, value: "Todos" }, ...getAllCategoryOptions()];
};
