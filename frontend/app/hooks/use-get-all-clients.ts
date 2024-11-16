import { useEffect, useState } from "react";

import { getPageNumber } from "@/utils/pagination";
import { useListClientsQuery } from "@/redux/features/clientApiSlice";

function useGetAllClients() {
    const [page, setPage] = useState(1);
    const [isPaginatingClients, setIsPaginatingClients] = useState(true);
    const {
        data,
        isLoading: isLoadingClients,
        error: errorClients,
    } = useListClientsQuery({ page });

    useEffect(() => {
        if (data && isPaginatingClients) {
            if (data.next) {
                const nextPage = getPageNumber(data.next);
                if (nextPage && nextPage > page) {
                    setPage(nextPage);
                }
            } else {
                setIsPaginatingClients(false);
            }
        }
    }, [data, page, isPaginatingClients]);

    return {
        clients: data?.results || [],
        isLoadingClients,
        isPaginatingClients,
        errorClients,
    };
}

export default useGetAllClients;
