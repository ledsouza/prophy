import Role from "@/enums/Role";
import type { SelectData } from "@/components/forms";

export const MANAGEABLE_ROLES: Array<{ role: Role; label: string }> = [
    { role: Role.FMI, label: "Físico Médico Interno" },
    { role: Role.FME, label: "Físico Médico Externo" },
    { role: Role.GP, label: "Gerente Prophy" },
    { role: Role.GGC, label: "Gerente Geral de Cliente" },
    { role: Role.GU, label: "Gerente de Unidade" },
    { role: Role.C, label: "Comercial" },
];

export const MANAGEABLE_ROLE_OPTIONS: SelectData[] = MANAGEABLE_ROLES.map((r, idx) => ({
    id: idx + 1,
    value: r.label,
}));

export const COMMERCIAL_MANAGEABLE_ROLES = new Set<Role>([Role.GGC, Role.GU]);

const OPTION_ID_TO_ROLE = new Map(MANAGEABLE_ROLES.map((r, idx) => [idx + 1, r.role] as const));

/**
 * Converts the selected option (from our Select component) into a Role.
 */
export function roleFromOption(option: SelectData | null, fallback: Role = Role.FMI): Role {
    if (!option) {
        return fallback;
    }

    return OPTION_ID_TO_ROLE.get(option.id) ?? fallback;
}

/**
 * Returns the human readable label for a Role.
 */
export function roleLabel(role: Role): string {
    return MANAGEABLE_ROLES.find((r) => r.role === role)?.label ?? role;
}
