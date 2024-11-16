import { useEffect, useState } from "react";
import { useListUnitsQuery } from "@/redux/features/unitApiSlice";
import { getPageNumber } from "@/utils/pagination";

function useGetAllUnits() {
    const [page, setPage] = useState(1);
    const [isPaginatingUnits, setIsPaginatingUnits] = useState(true);
    const {
        data,
        isLoading: isLoadingUnits,
        error: errorUnits,
    } = useListUnitsQuery({ page });

    useEffect(() => {
        if (data && isPaginatingUnits) {
            if (data.next) {
                const nextPage = getPageNumber(data.next);
                if (nextPage && nextPage > page) {
                    setPage(nextPage);
                }
            } else {
                setIsPaginatingUnits(false);
            }
        }
    }, [data, page, isPaginatingUnits]);

    return {
        units: data?.results || [],
        isLoadingUnits,
        isPaginatingUnits,
        errorUnits,
    };
}

export default useGetAllUnits;
