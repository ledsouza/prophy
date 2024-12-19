import { useEffect, useState } from "react";

import {
    ClientDTO,
    useListClientsQuery,
} from "@/redux/features/clientApiSlice";
import { UnitDTO, useListUnitsQuery } from "@/redux/features/unitApiSlice";

import { SelectData } from "@/components/forms/Select";
import { toast } from "react-toastify";
import useGetAll from "./use-get-all";
import { useListEquipmentsQuery } from "@/redux/features/equipmentApiSlice";

export function useClientDataLoading() {
    const [clientOptions, setClientOptions] = useState<SelectData[]>([]);
    const [selectedClient, setSelectedClient] = useState<SelectData | null>(
        null
    );
    const [filteredClient, setFilteredClient] = useState<ClientDTO | null>(
        null
    );
    const [filteredUnits, setFilteredUnits] = useState<UnitDTO[] | null>(null);

    const {
        items: clients,
        isLoading: isPaginatingClients,
        error: errorClients,
    } = useGetAll(useListClientsQuery);
    const {
        items: units,
        isLoading: isPaginatingUnits,
        error: errorUnits,
    } = useGetAll(useListUnitsQuery);
    const {
        items: equipments,
        isLoading: isPaginatingEquipments,
        error: errorEquipments,
    } = useGetAll(useListEquipmentsQuery);

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
    }, [errorClients, errorUnits, errorEquipments]);

    // Initialize client data
    // The client options allow users to choose which client's information they want to see.
    // Those options will be used in an select input.
    // Default select option will be the first result in the array.
    useEffect(() => {
        if (clients && !isPaginatingClients) {
            const clientOptions = clients.map((client) => ({
                id: client.id,
                value: client.name,
            }));

            setClientOptions(clientOptions);
            setSelectedClient(clientOptions[0]);
        }
    }, [clients, isPaginatingClients]);

    // Filter units based on selected client
    useEffect(() => {
        // It only runs when all data is ready.
        if (isPaginatingClients || isPaginatingUnits) return;

        const newFilteredClient = clients.find(
            (client) => client.id === selectedClient?.id
        );

        if (newFilteredClient) {
            setFilteredClient(newFilteredClient);
            setFilteredUnits(
                units.filter((unit) => unit.client === selectedClient?.id)
            );
        }
    }, [selectedClient, isPaginatingClients, isPaginatingUnits]);

    return {
        isLoading:
            isPaginatingClients || isPaginatingUnits || isPaginatingEquipments,
        hasNoData: clients.length === 0,
        clientOptions,
        selectedClient,
        filteredClient,
        filteredUnits,
        equipments,
        setSelectedClient,
    };
}
