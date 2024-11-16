import { useEffect, useState } from "react";
import { useListEquipmentsQuery } from "@/redux/features/equipmentApiSlice";
import { getPageNumber } from "@/utils/pagination";

function useGetAllEquipments() {
    const [page, setPage] = useState(1);
    const [isPaginatingEquipments, setIsPaginatingEquipments] = useState(true);
    const {
        data,
        isLoading: isLoadingEquipments,
        error: errorEquipments,
    } = useListEquipmentsQuery({ page });

    useEffect(() => {
        if (data && isPaginatingEquipments) {
            if (data.next) {
                const nextPage = getPageNumber(data.next);
                if (nextPage && nextPage > page) {
                    setPage(nextPage);
                }
            } else {
                setIsPaginatingEquipments(false);
            }
        }
    }, [data, page, isPaginatingEquipments]);

    return {
        equipments: data?.results || [],
        isLoadingEquipments,
        isPaginatingEquipments,
        errorEquipments,
    };
}

export default useGetAllEquipments;
