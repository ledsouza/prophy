import { useEffect, useState } from "react";
import { UnitDTO, useListUnitsQuery } from "@/redux/features/unitApiSlice";
import { getPageNumber } from "@/utils/pagination";

function useGetAllUnits() {
    const [page, setPage] = useState(1);
    const [units, setUnits] = useState<UnitDTO[]>([]);
    const {
        data: paginatedUnitsData,
        isLoading: isLoadingUnits,
        error: errorUnits,
    } = useListUnitsQuery({ page });

    useEffect(() => {
        if (paginatedUnitsData?.results) {
            setUnits((prevState) => [
                ...prevState,
                ...paginatedUnitsData.results,
            ]);

            if (paginatedUnitsData.next) {
                const nextPage = getPageNumber(paginatedUnitsData.next);
                if (nextPage) {
                    setPage(nextPage);
                }
            }
        }
    }, [paginatedUnitsData]);

    return {
        units,
        isLoadingUnits,
        errorUnits,
    };
}

export default useGetAllUnits;
