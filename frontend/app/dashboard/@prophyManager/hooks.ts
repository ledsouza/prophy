import { useMemo } from "react";
import { ClientDTO, useListClientsQuery } from "@/redux/features/clientApiSlice";
import { EquipmentDTO, useListEquipmentsQuery } from "@/redux/features/equipmentApiSlice";
import { PaginatedResponse } from "@/redux/services/apiSlice";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { ClientFilters, EquipmentFilters } from "./types";

type UseSearchQueriesParams = {
    clientCurrentPage: number;
    clientAppliedFilters: ClientFilters;
    equipmentCurrentPage: number;
    equipmentAppliedFilters: EquipmentFilters;
};

type UseSearchQueriesReturn = {
    clientsData: PaginatedResponse<ClientDTO> | undefined;
    clientsLoading: boolean;
    clientsError: FetchBaseQueryError | SerializedError | undefined;
    equipmentsData: PaginatedResponse<EquipmentDTO> | undefined;
    equipmentsLoading: boolean;
    equipmentsError: FetchBaseQueryError | SerializedError | undefined;
};

export const useSearchQueries = ({
    clientCurrentPage,
    clientAppliedFilters,
    equipmentCurrentPage,
    equipmentAppliedFilters,
}: UseSearchQueriesParams): UseSearchQueriesReturn => {
    const clientQueryParams = useMemo(() => {
        const params: any = { page: clientCurrentPage };

        if (clientAppliedFilters.name) params.name = clientAppliedFilters.name;
        if (clientAppliedFilters.cnpj) params.cnpj = clientAppliedFilters.cnpj;
        if (clientAppliedFilters.city) params.city = clientAppliedFilters.city;
        if (clientAppliedFilters.user_role) params.user_role = clientAppliedFilters.user_role;
        if (clientAppliedFilters.contract_type)
            params.contract_type = clientAppliedFilters.contract_type;
        if (clientAppliedFilters.operation_status)
            params.operation_status = clientAppliedFilters.operation_status;

        return params;
    }, [clientCurrentPage, clientAppliedFilters]);

    const equipmentQueryParams = useMemo(() => {
        const params: any = { page: equipmentCurrentPage };

        if (equipmentAppliedFilters.modality) params.modality = equipmentAppliedFilters.modality;
        if (equipmentAppliedFilters.manufacturer)
            params.manufacturer = equipmentAppliedFilters.manufacturer;
        if (equipmentAppliedFilters.client_name)
            params.client_name = equipmentAppliedFilters.client_name;

        return params;
    }, [equipmentCurrentPage, equipmentAppliedFilters]);

    const {
        data: clientsData,
        isLoading: clientsLoading,
        error: clientsError,
    } = useListClientsQuery(clientQueryParams);

    const {
        data: equipmentsData,
        isLoading: equipmentsLoading,
        error: equipmentsError,
    } = useListEquipmentsQuery(equipmentQueryParams);

    return {
        clientsData,
        clientsLoading,
        clientsError,
        equipmentsData,
        equipmentsLoading,
        equipmentsError,
    };
};
