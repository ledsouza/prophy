export type ClientFilters = {
    name: string;
    cnpj: string;
    city: string;
    user_role: string;
    responsible_cpf: string;
    contract_type: string;
    operation_status: string;
};

export type EquipmentFilters = {
    modality: string;
    manufacturer: string;
    client_name: string;
};

export type AppointmentFilters = {
    date_start: string;
    date_end: string;
    status: string;
    client_name: string;
    unit_city: string;
    unit_name: string;
};
