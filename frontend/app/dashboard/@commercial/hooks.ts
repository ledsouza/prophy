import { useMemo } from "react";
import { useListClientsQuery } from "@/redux/features/clientApiSlice";
import type { ClientDTO } from "@/types/client";
import { ProposalDTO, useListProposalsQuery } from "@/redux/features/proposalApiSlice";
import { PaginatedResponse } from "@/redux/services/apiSlice";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { ClientFilters, ProposalFilters } from "./types";

type UseSearchQueriesParams = {
    clientCurrentPage: number;
    clientAppliedFilters: ClientFilters;
    proposalCurrentPage: number;
    proposalAppliedFilters: ProposalFilters;
};

type UseSearchQueriesReturn = {
    clientsData: PaginatedResponse<ClientDTO> | undefined;
    clientsLoading: boolean;
    clientsError: FetchBaseQueryError | SerializedError | undefined;
    proposalsData: PaginatedResponse<ProposalDTO> | undefined;
    proposalsLoading: boolean;
    proposalsError: FetchBaseQueryError | SerializedError | undefined;
};

export const useSearchQueries = ({
    clientCurrentPage,
    clientAppliedFilters,
    proposalCurrentPage,
    proposalAppliedFilters,
}: UseSearchQueriesParams): UseSearchQueriesReturn => {
    const clientQueryParams = useMemo(() => {
        const params: any = { page: clientCurrentPage };

        if (clientAppliedFilters.name) params.name = clientAppliedFilters.name;
        if (clientAppliedFilters.cnpj) params.cnpj = clientAppliedFilters.cnpj;
        if (clientAppliedFilters.city) params.city = clientAppliedFilters.city;
        if (clientAppliedFilters.contract_type)
            params.contract_type = clientAppliedFilters.contract_type;
        if (clientAppliedFilters.status) params.status = clientAppliedFilters.status;

        return params;
    }, [clientCurrentPage, clientAppliedFilters]);

    const proposalQueryParams = useMemo(() => {
        const params: any = { page: proposalCurrentPage };

        if (proposalAppliedFilters.cnpj) params.cnpj = proposalAppliedFilters.cnpj;
        if (proposalAppliedFilters.contact_name)
            params.contact_name = proposalAppliedFilters.contact_name;
        if (proposalAppliedFilters.contract_type)
            params.contract_type = proposalAppliedFilters.contract_type;
        if (proposalAppliedFilters.status) params.status = proposalAppliedFilters.status;

        return params;
    }, [proposalCurrentPage, proposalAppliedFilters]);

    const {
        data: clientsData,
        isLoading: clientsLoading,
        error: clientsError,
    } = useListClientsQuery(clientQueryParams);

    const {
        data: proposalsData,
        isLoading: proposalsLoading,
        error: proposalsError,
    } = useListProposalsQuery(proposalQueryParams);

    return {
        clientsData,
        clientsLoading,
        clientsError,
        proposalsData,
        proposalsLoading,
        proposalsError,
    };
};
