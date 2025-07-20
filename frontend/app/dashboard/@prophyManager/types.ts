export type ClientFilters = {
    name: string;
    cnpj: string;
    city: string;
    user_role: string;
    contract_type: string;
    operation_status: string;
};

export type EquipmentFilters = {
    modality: string;
    manufacturer: string;
    client_name: string;
};
