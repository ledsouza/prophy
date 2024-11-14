"use client";

import { usePathname } from "next/navigation";

import { getIdFromUrl } from "@/utils/url";
import useGetAllUnits from "@/hooks/use-get-all-units";
import useGetAllEquipments from "@/hooks/use-get-all-equipments";
import { useEffect, useState } from "react";
import { UnitDTO } from "@/redux/features/unitApiSlice";
import UnitDetails from "@/components/client/UnitDetails";
import { Spinner } from "@/components/common";

function UnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);

    const { units, isLoadingUnits, errorUnits } = useGetAllUnits();
    const { equipments, isLoadingEquipments, errorEquipments } =
        useGetAllEquipments();

    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | undefined>(
        undefined
    );

    useEffect(() => {
        if (units.length > 0) {
            setSelectedUnit(units.find((unit) => unit.id === unitId));
        }
    }, [units]);

    if (isLoadingUnits || isLoadingEquipments) {
        return <Spinner fullscreen />;
    }

    if (selectedUnit) {
        return <UnitDetails selectedUnit={selectedUnit} />;
    }
}

export default UnitPage;
