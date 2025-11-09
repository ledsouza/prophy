"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    useGetByCnpjQuery,
    useListAllClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";
import type { ClientDTO } from "@/types/client";
import {
    UnitDTO,
    useListAllUnitsQuery,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";
import { useListAllEquipmentsQuery } from "@/redux/features/equipmentApiSlice";

function useSingleClientLoading(cnpj: string) {
    const [filteredClient, setFilteredClient] = useState<ClientDTO | null>(null);
    const [filteredUnits, setFilteredUnits] = useState<UnitDTO[]>([]);

    // Fetch client data by CNPJ
    const {
        data: clientsData,
        isLoading: isPaginatingClients,
        error: errorClients,
    } = useGetByCnpjQuery({ cnpj, page: 1 });

    // Fetch all units
    const { data: units, isLoading: isPaginatingUnits, error: errorUnits } = useListAllUnitsQuery();

    // Fetch all equipments
    const {
        data: equipments,
        isLoading: isPaginatingEquipments,
        error: errorEquipments,
    } = useListAllEquipmentsQuery();

    // Fetch operations data
    const { data: clientsOperations, isLoading: isLoadingClientsOperations } =
        useListAllClientsOperationsQuery();
    const { data: unitsOperations, isLoading: isLoadingUnitsOperations } =
        useListAllUnitsOperationsQuery();

    // Handle errors
    useEffect(() => {
        const errors = {
            clients: errorClients && "Erro ao carregar dados do cliente.",
            units: errorUnits && "Erro ao carregar dados das unidades.",
            equipments: errorEquipments && "Erro ao carregar dados dos equipamentos.",
        };

        Object.entries(errors).forEach(([key, message]) => {
            if (message) {
                toast.error(`${message} Por favor, tente novamente mais tarde.`);
            }
        });
    }, [errorClients, errorUnits, errorEquipments]);

    // Set filtered client from API response
    useEffect(() => {
        if (clientsData && !isPaginatingClients) {
            const client = clientsData.results?.[0];
            if (client) {
                setFilteredClient(client);
            } else {
                setFilteredClient(null);
            }
        }
    }, [clientsData, isPaginatingClients]);

    // Filter units based on the selected client
    useEffect(() => {
        if (isPaginatingUnits || !filteredClient) return;

        setFilteredUnits(units ? units.filter((unit) => unit.client === filteredClient.id) : []);
    }, [filteredClient, isPaginatingUnits, units]);

    return {
        isLoading: isPaginatingClients || isPaginatingUnits || isPaginatingEquipments,
        hasNoData: !filteredClient && !isPaginatingClients,
        clientNotFound:
            !filteredClient && !isPaginatingClients && clientsData?.results?.length === 0,
        filteredClient,
        filteredUnits,
        equipments,
        clientsOperations,
        unitsOperations,
        isLoadingClientsOperations,
        isLoadingUnitsOperations,
    };
}

export default useSingleClientLoading;
