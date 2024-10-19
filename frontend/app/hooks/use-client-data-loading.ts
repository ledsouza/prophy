import { useEffect, useState } from "react";

import { useListClientsQuery, Cliente } from "@/redux/features/clienteApiSlice";
import { useListUnitsQuery, Unidade } from "@/redux/features/unidadeApiSlice";
import {
    useListEquipmentsQuery,
    Equipamento,
} from "@/redux/features/equipamentoApiSlice";

import { SelectData } from "@/components/forms/Select";
import { toast } from "react-toastify";
import { getPageNumber } from "@/utils/pagination";

export function useClientDataLoading() {
    const [page, setPage] = useState(1);
    const [equipments, setEquipments] = useState<Equipamento[]>([]);
    const [clientOptions, setClientOptions] = useState<SelectData[]>([]);
    const [selectedClient, setSelectedClient] = useState<SelectData | null>(
        null
    );
    const [filteredClient, setFilteredClient] = useState<Cliente | null>(null);
    const [filteredUnits, setFilteredUnits] = useState<Unidade[] | null>(null);

    const {
        data: paginatedClientsData,
        isLoading: isLoadingClients,
        error: errorClients,
    } = useListClientsQuery({ page: 1 });

    const {
        data: paginatedUnitsData,
        isLoading: isLoadingUnits,
        error: errorUnits,
    } = useListUnitsQuery({ page: 1 });

    const {
        data: paginatedEquipmentsData,
        isLoading: isLoadingEquipments,
        error: errorEquipments,
    } = useListEquipmentsQuery({ page });

    // Handle errors
    useEffect(() => {
        const errors = {
            clients: errorClients && "Erro ao carregar dados do cliente.",
            units: errorUnits && "Erro ao carregar dados das unidades.",
            equipments:
                errorEquipments && "Erro ao carregar dados dos equipamentos.",
        };

        Object.entries(errors).forEach(([key, message]) => {
            if (message) {
                console.error(`Error in ${key}:`, message);
                toast.error(
                    `${message} Por favor, tente novamente mais tarde.`
                );
            }
        });
    }, [errorClients, errorUnits]);

    // Initialize client data
    // The client options allow users to choose which client's information they want to see.
    // Those options will be used in an select input.
    // Default select option will be the first result in the array.
    useEffect(() => {
        if (paginatedClientsData?.results) {
            const clientOptions = paginatedClientsData.results.map(
                (client) => ({
                    id: client.id,
                    value: client.nome_instituicao,
                })
            );

            setClientOptions(clientOptions);
            setSelectedClient(clientOptions[0]);
        }
    }, [paginatedClientsData]);

    // Handle equipment pagination
    useEffect(() => {
        if (paginatedEquipmentsData?.results) {
            setEquipments((prev) => [
                ...prev,
                ...paginatedEquipmentsData.results,
            ]);

            if (paginatedEquipmentsData.next) {
                const nextPage = getPageNumber(paginatedEquipmentsData.next);
                if (nextPage) {
                    setPage(nextPage);
                }
            }
        }
    }, [paginatedEquipmentsData]);

    // Filter units based on selected client
    useEffect(() => {
        // It only runs when all data is ready.
        if (
            !selectedClient ||
            !paginatedClientsData?.results ||
            !paginatedUnitsData?.results
        )
            return;

        const newFilteredClient = paginatedClientsData.results.find(
            (client) => client.id === selectedClient.id
        );

        if (newFilteredClient) {
            setFilteredClient(newFilteredClient);
            setFilteredUnits(
                paginatedUnitsData.results.filter(
                    (unit) => unit.cliente === selectedClient.id
                )
            );
        }
    }, [selectedClient, paginatedClientsData, paginatedUnitsData]);

    return {
        isLoading: isLoadingClients || isLoadingUnits || isLoadingEquipments,
        hasNoData: paginatedClientsData?.count === 0,
        clientOptions,
        selectedClient,
        filteredClient,
        filteredUnits,
        equipments,
        setSelectedClient,
    };
}
