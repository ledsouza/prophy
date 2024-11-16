"use client";

import { usePathname } from "next/navigation";

import { getIdFromUrl } from "@/utils/url";
import useGetAllUnits from "@/hooks/use-get-all-units";
import useGetAllEquipments from "@/hooks/use-get-all-equipments";
import { useEffect, useState } from "react";
import { UnitDTO } from "@/redux/features/unitApiSlice";
import UnitDetails from "@/components/client/UnitDetails";
import { Spinner } from "@/components/common";
import { Typography } from "@/components/foundation";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";
import { Input } from "@/components/forms";
import EquipmentCard from "@/components/client/EquipmentCard";

function UnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);

    console.log("Component rendered with unitId:", unitId);

    const { units, isLoadingUnits, isPaginatingUnits, errorUnits } =
        useGetAllUnits();
    const {
        equipments,
        isLoadingEquipments,
        isPaginatingEquipments,
        errorEquipments,
    } = useGetAllEquipments();

    console.log("Custom hooks data:", {
        unitsLength: units.length,
        equipmentsLength: equipments.length,
        equipments: equipments,
        isLoadingUnits,
        isLoadingEquipments,
        isPaginatingUnits,
        isPaginatingEquipments,
    });

    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | undefined>(
        undefined
    );
    const [filteredEquipments, setFilteredEquipments] = useState<
        EquipmentDTO[]
    >([]);

    // const [searchedEquipments, setSearchedEquipments] = useState<
    //     EquipmentDTO[]
    // >([]);
    // const [searchTerm, setSearchTerm] = useState("");

    // const handleSearchInputChange = (
    //     event: React.ChangeEvent<HTMLInputElement>
    // ) => {
    //     setSearchTerm(event.target.value);
    // };

    useEffect(() => {
        // Only run when both data finished paginating
        if (isPaginatingUnits || isPaginatingEquipments) return;

        // Add null checks to prevent unnecessary renders
        if (!units?.length || !equipments?.length || !unitId) return;

        setSelectedUnit(units.find((unit) => unit.id === unitId));
        setFilteredEquipments(
            equipments.filter((equipment) => equipment.unit === unitId)
        );
    }, [units, equipments, unitId, isPaginatingUnits, isPaginatingEquipments]);

    // useEffect(() => {
    //     if (filteredEquipments.length > 0) {
    //         if (searchTerm.length > 0) {
    //             setSearchedEquipments(
    //                 filteredEquipments.filter((equipment) =>
    //                     equipment.model
    //                         .toLowerCase()
    //                         .includes(searchTerm.toLowerCase())
    //                 )
    //             );
    //         } else {
    //             setSearchedEquipments(filteredEquipments);
    //         }
    //     } else {
    //         setSearchedEquipments([]);
    //     }
    // }, [filteredEquipments, searchTerm]);

    if (isLoadingUnits || isLoadingEquipments) {
        return <Spinner fullscreen />;
    }

    if (selectedUnit) {
        console.log(
            "Rendering with filteredEquipments:",
            filteredEquipments.map((e) => e.id)
        );
        return (
            <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4">
                <UnitDetails selectedUnit={selectedUnit} />

                <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] overflow-y-auto flex flex-col gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <Typography
                        element="h2"
                        size="title2"
                        className="font-bold"
                    >
                        Equipamentos
                    </Typography>

                    {/* {filteredEquipments?.length !== 0 && (
                        <Input
                            placeholder="Buscar equipamentos por modelo"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                        />
                    )} */}

                    <div className="flex flex-col gap-6">
                        {filteredEquipments.length > 0 ? (
                            filteredEquipments.map((equipment) => (
                                <EquipmentCard
                                    key={equipment.id}
                                    equipment={equipment}
                                    status="Aceito"
                                    // onClick={() =>
                                    //     router.push(
                                    //         `/dashboard/equipment/${equipment.id}`
                                    //     )
                                    // }
                                    dataTestId={`equipment-card-${equipment.id}`}
                                />
                            ))
                        ) : (
                            <Typography
                                element="p"
                                size="lg"
                                dataTestId="unit-not-found"
                                className="justify-center text-center"
                            >
                                {filteredEquipments?.length === 0
                                    ? "Nenhuma unidade registrada"
                                    : "Nenhuma unidade encontrada para o termo pesquisado"}
                            </Typography>
                        )}
                    </div>
                </div>
            </main>
        );
    }
}

export default UnitPage;
