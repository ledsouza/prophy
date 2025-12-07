import { useMemo } from "react";

import { useListClientsQuery } from "@/redux/features/clientApiSlice";
import { useListProposalsQuery, type ProposalDTO } from "@/redux/features/proposalApiSlice";
import { useListAppointmentsPageQuery } from "@/redux/features/appointmentApiSlice";
import type { ClientDTO } from "@/types/client";
import type { AppointmentDTO } from "@/types/appointment";
import { PaginatedResponse } from "@/redux/services/apiSlice";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { AppointmentFilters, ClientFilters, ProposalFilters } from "./types";

type UseSearchQueriesParams = {
    clientCurrentPage: number;
    clientAppliedFilters: ClientFilters;
    proposalCurrentPage: number;
    proposalAppliedFilters: ProposalFilters;
    appointmentsCurrentPage: number;
    appointmentsAppliedFilters: AppointmentFilters;
};

type UseSearchQueriesReturn = {
    clientsData: PaginatedResponse<ClientDTO> | undefined;
    clientsLoading: boolean;
    clientsError: FetchBaseQueryError | SerializedError | undefined;
    proposalsData: PaginatedResponse<ProposalDTO> | undefined;
    proposalsLoading: boolean;
    proposalsError: FetchBaseQueryError | SerializedError | undefined;
    appointmentsData: PaginatedResponse<AppointmentDTO> | undefined;
    appointmentsLoading: boolean;
    appointmentsError: FetchBaseQueryError | SerializedError | undefined;
};

export const useSearchQueries = ({
    clientCurrentPage,
    clientAppliedFilters,
    proposalCurrentPage,
    proposalAppliedFilters,
    appointmentsCurrentPage,
    appointmentsAppliedFilters,
}: UseSearchQueriesParams): UseSearchQueriesReturn => {
    const clientQueryParams = useMemo(() => {
        const params: Record<string, unknown> = { page: clientCurrentPage };

        if (clientAppliedFilters.name) params.name = clientAppliedFilters.name;
        if (clientAppliedFilters.cnpj) params.cnpj = clientAppliedFilters.cnpj;
        if (clientAppliedFilters.city) params.city = clientAppliedFilters.city;
        if (clientAppliedFilters.contract_type)
            params.contract_type = clientAppliedFilters.contract_type;
        if (clientAppliedFilters.is_active) params.is_active = clientAppliedFilters.is_active;

        return params;
    }, [clientCurrentPage, clientAppliedFilters]);

    const proposalQueryParams = useMemo(() => {
        const params: Record<string, unknown> = { page: proposalCurrentPage };

        if (proposalAppliedFilters.cnpj) params.cnpj = proposalAppliedFilters.cnpj;
        if (proposalAppliedFilters.contact_name)
            params.contact_name = proposalAppliedFilters.contact_name;
        if (proposalAppliedFilters.contract_type)
            params.contract_type = proposalAppliedFilters.contract_type;
        if (proposalAppliedFilters.status) params.status = proposalAppliedFilters.status;
        if (proposalAppliedFilters.expiring_annual === "true") {
            params.expiring_annual = "true";
        }

        return params;
    }, [proposalCurrentPage, proposalAppliedFilters]);

    const appointmentsQueryParams = useMemo(() => {
        const params: Record<string, unknown> = { page: appointmentsCurrentPage };

        if (appointmentsAppliedFilters.date_start) {
            params.date_start = appointmentsAppliedFilters.date_start;
        }
        if (appointmentsAppliedFilters.date_end) {
            params.date_end = appointmentsAppliedFilters.date_end;
        }
        if (appointmentsAppliedFilters.status) {
            params.status = appointmentsAppliedFilters.status;
        }
        if (appointmentsAppliedFilters.client_name) {
            params.client_name = appointmentsAppliedFilters.client_name;
        }
        if (appointmentsAppliedFilters.unit_city) {
            params.unit_city = appointmentsAppliedFilters.unit_city;
        }
        if (appointmentsAppliedFilters.unit_name) {
            params.unit_name = appointmentsAppliedFilters.unit_name;
        }

        return params;
    }, [appointmentsCurrentPage, appointmentsAppliedFilters]);

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

    const {
        data: appointmentsData,
        isLoading: appointmentsLoading,
        error: appointmentsError,
    } = useListAppointmentsPageQuery(appointmentsQueryParams);

    return {
        clientsData,
        clientsLoading,
        clientsError,
        proposalsData,
        proposalsLoading,
        proposalsError,
        appointmentsData,
        appointmentsLoading,
        appointmentsError,
    };
};
