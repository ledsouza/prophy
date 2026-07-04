import { useCallback } from "react";

import { useAppDispatch } from "@/redux/hooks";
import { apiSlice } from "@/redux/services/apiSlice";

export function useUnitPageRefresh() {
    const dispatch = useAppDispatch();

    return useCallback(() => {
        dispatch(
            apiSlice.util.invalidateTags([
                { type: "Unit", id: "LIST" },
                { type: "UnitOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
                { type: "EquipmentOperation", id: "LIST" },
                { type: "Appointment", id: "LIST" },
                { type: "Report", id: "LIST" },
            ]),
        );
    }, [dispatch]);
}
