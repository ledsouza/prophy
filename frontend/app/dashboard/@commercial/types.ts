import ClientStatus from "@/enums/ClientStatus";

export type ClientFilters = {
    name: string;
    cnpj: string;
    city: string;
    contract_type: string;
    status: ClientStatus | "";
};

export type ProposalFilters = {
    cnpj: string;
    contact_name: string;
    contract_type: string;
    status: string;
};
