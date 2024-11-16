import { useEffect, useState } from "react";

import {
    useListClientsQuery,
    ClientDTO,
} from "@/redux/features/clientApiSlice";
import { useListUnitsQuery, UnitDTO } from "@/redux/features/unitApiSlice";
import {
    useListEquipmentsQuery,
    EquipmentDTO,
} from "@/redux/features/equipmentApiSlice";

import { SelectData } from "@/components/forms/Select";
import { toast } from "react-toastify";
import { getPageNumber } from "@/utils/pagination";
import useGetAllClients from "./use-get-all-clients";
import useGetAllEquipments from "./use-get-all-equipments";
import useGetAllUnits from "./use-get-all-units";

export function useClientDataLoading() {
    const [clientOptions, setClientOptions] = useState<SelectData[]>([]);
    const [selectedClient, setSelectedClient] = useState<SelectData | null>(
        null
    );
    const [filteredClient, setFilteredClient] = useState<ClientDTO | null>(
        null
    );
    const [filteredUnits, setFilteredUnits] = useState<UnitDTO[] | null>(null);

    const { clients, isPaginatingClients, errorClients } = useGetAllClients();
    const { units, isPaginatingUnits, errorUnits } = useGetAllUnits();
    const { equipments, isPaginatingEquipments, errorEquipments } =
        useGetAllEquipments();

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
