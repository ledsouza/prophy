import { useEffect, useState } from "react";

import { getPageNumber } from "@/utils/pagination";
import {
    ClientDTO,
    useListClientsQuery,
} from "@/redux/features/clientApiSlice";

function useGetAllClients() {
    const [page, setPage] = useState(1);
    const [clients, setClients] = useState<ClientDTO[]>([]);
    const {
        data: paginatedClientsData,
        isLoading: isLoadingClients,
        error: errorClients,
    } = useListClientsQuery({ page });

    useEffect(() => {
        if (paginatedClientsData?.results) {
            setClients((prevState) => [
                ...prevState,
                ...paginatedClientsData.results,
            ]);

            if (paginatedClientsData.next) {
                const nextPage = getPageNumber(paginatedClientsData.next);
                if (nextPage) {
                    setPage(nextPage);
                }
            }
        }
    }, [paginatedClientsData]);

    return {
        clients,
        isLoadingClients,
        errorClients,
    };
}

export default useGetAllClients;
