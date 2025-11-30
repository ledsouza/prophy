export type ClientFilters = {
    name: string;
    cnpj: string;
    city: string;
    contract_type: string;
    is_active: string;
};

export type ProposalFilters = {
    cnpj: string;
    contact_name: string;
    contract_type: string;
    status: string;
    expiring_annual?: string;
};
