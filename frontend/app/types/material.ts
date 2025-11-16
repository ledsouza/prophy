export type MaterialVisibility = "PUB" | "INT";

export type MaterialCategoryCode =
    | "SIG" // Sinalizações / Fluxogramas / Informativos (public)
    | "IOE" // Instruções Operacionais de Equipe (public/internal)
    | "TER" // Termos (public)
    | "POP" // POPs (public/internal)
    | "LEG" // Legislação Vigente (public)
    | "GUI" // Guias (public/internal)
    | "MAN" // Manuais (public/internal)
    | "OUT" // Outros (public/internal)
    | "MRE" // Modelos de Relatórios (internal)
    | "MDO" // Modelos de Documentos (internal)
    | "IDV"; // Material Institucional de Identidade Visual (internal)

export type MaterialDTO = {
    id: number;
    title: string;
    description?: string | null;
    visibility: MaterialVisibility;
    category: MaterialCategoryCode;
    file: string;
    file_name?: string;
    allowed_external_users: number[];
    created_at: string; // ISO string
    updated_at: string; // ISO string
};

export type ListMaterialsArgs = {
    page?: number;
    visibility?: MaterialVisibility;
    category?: MaterialCategoryCode;
    search?: string;
};

export type CreateMaterialArgs = {
    title: string;
    description?: string;
    visibility: MaterialVisibility;
    category: MaterialCategoryCode;
    file: File;
    /**
     * Only applicable for PROPHY_MANAGER and internal materials.
     * Do not send for public materials (backend will reject).
     */
    allowed_external_user_ids?: number[];
};

export type UpdateMaterialArgs = {
    id: number;
    title?: string;
    description?: string;
    file?: File;
};
