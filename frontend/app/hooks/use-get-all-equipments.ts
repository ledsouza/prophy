import { useEffect, useState } from "react";
import {
    EquipmentDTO,
    useListEquipmentsQuery,
} from "@/redux/features/equipmentApiSlice";
import { getPageNumber } from "@/utils/pagination";

function useGetAllEquipments() {
    const [page, setPage] = useState(1);
    const [equipments, setEquipments] = useState<EquipmentDTO[]>([]);
    const {
        data: paginatedEquipmentsData,
        isLoading: isLoadingEquipments,
        error: errorEquipments,
    } = useListEquipmentsQuery({ page });

    useEffect(() => {
        if (paginatedEquipmentsData?.results) {
            setEquipments((prevState) => [
                ...prevState,
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

    return {
        equipments,
        isLoadingEquipments,
        errorEquipments,
    };
}

export default useGetAllEquipments;
