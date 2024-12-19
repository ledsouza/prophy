import { useEffect, useState } from "react";

import { getPageNumber } from "@/utils/pagination";
import { useListClientsOperationsQuery } from "@/redux/features/clientApiSlice";

function useGetAllClientsOperations() {
    const [page, setPage] = useState(1);
    const [isPaginating, setIsPaginating] = useState(true);
    const { data, isLoading, error } = useListClientsOperationsQuery({ page });

    useEffect(() => {
        if (data && isPaginating) {
            if (data.next && !isLoading) {
                const nextPage = getPageNumber(data.next);
                if (nextPage && nextPage > page) {
                    setPage(nextPage);
                }
            } else {
                setIsPaginating(false);
            }
        }
    }, [data, page, isPaginating]);

    return {
        clients: data?.results || [],
        isLoading: isPaginating,
        error,
    };
}

export default useGetAllClientsOperations;
