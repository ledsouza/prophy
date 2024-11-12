import { useEffect, useState } from "react";
import {
    EquipmentDTO,
    useListEquipmentsQuery,
} from "@/redux/features/equipmentApiSlice";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

export const useAllEquipments = () => {
    const [allEquipments, setAllEquipments] = useState<EquipmentDTO[]>([]);
    const [isLoadingAll, setIsLoadingAll] = useState(true);
    const [errorAll, setErrorAll] = useState<
        FetchBaseQueryError | SerializedError | null
    >(null);
    const [currentPage, setcurrentPage] = useState(1);
    const { data, error, isLoading } = useListEquipmentsQuery({
        page: currentPage,
    });

    const fetchAllEquipments = async () => {
        let allResults: EquipmentDTO[] = [];
        let currentPage = 1;
        let hasNextPage = true;

        try {
            while (hasNextPage) {
                if (error) {
                    setErrorAll(error);
                    return;
                }

                if (data) {
                    allResults = [...allResults, ...data.results];
                    hasNextPage = Boolean(data.next); // Check if there's another page
                    setcurrentPage((currentPage += 1));
                }

                if (isLoading) {
                    setIsLoadingAll(true);
                } else {
                    setIsLoadingAll(false);
                }
            }

            setAllEquipments(allResults);
        } catch (err: any) {
            setErrorAll(err);
        } finally {
            setIsLoadingAll(false);
        }
    };

    useEffect(() => {
        fetchAllEquipments();
    }, []);

    return { allEquipments, isLoadingAll, errorAll };
};
