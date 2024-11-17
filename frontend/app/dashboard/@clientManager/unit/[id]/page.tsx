"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getIdFromUrl } from "@/utils/url";
import { UnitDTO } from "@/redux/features/unitApiSlice";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";

import useGetAllUnits from "@/hooks/use-get-all-units";
import useGetAllEquipments from "@/hooks/use-get-all-equipments";

import { Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Modal, Spinner } from "@/components/common";
import {
    UnitDetails,
    EquipmentCard,
    EquipmentDetails,
} from "@/components/client";

function UnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] =
        useState<EquipmentDTO | null>(null);

    const { units, isLoadingUnits, isPaginatingUnits, errorUnits } =
        useGetAllUnits();
    const {
        equipments,
        isLoadingEquipments,
        isPaginatingEquipments,
        errorEquipments,
    } = useGetAllEquipments();

    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | undefined>(
        undefined
    );
    const [filteredEquipments, setFilteredEquipments] = useState<
        EquipmentDTO[]
    >([]);

    const [searchedEquipments, setSearchedEquipments] = useState<
        EquipmentDTO[]
    >([]);
    const [searchTerm, setSearchTerm] = useState("");

    function handleClickEquipmentCard(equipment: EquipmentDTO) {
        setSelectedEquipment(equipment);
        setIsModalOpen(true);
    }

    const handleSearchInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(event.target.value);
    };

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

    useEffect(() => {
        if (filteredEquipments.length > 0) {
            if (searchTerm.length > 0) {
                setSearchedEquipments(
                    filteredEquipments.filter((equipment) =>
                        equipment.model
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    )
                );
            } else {
                setSearchedEquipments(filteredEquipments);
            }
        } else {
            setSearchedEquipments([]);
        }
    }, [filteredEquipments, searchTerm]);

    if (isLoadingUnits || isLoadingEquipments) {
        return <Spinner fullscreen />;
    }

    if (errorUnits || errorEquipments) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="data-not-found"
                >
                    Ocorreu um problema ao carregar os dados.
                </Typography>
                <Typography element="p" size="lg">
                    Aguarde alguns minutos e tente novamente. Se o problema
                    persistir, entre em contato conosco.
                </Typography>
                <Button onClick={() => router.back()} data-testid="btn-back">
                    Voltar
                </Button>
            </div>
        );
    }

    if (selectedUnit) {
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

                    {filteredEquipments?.length !== 0 && (
                        <Input
                            placeholder="Buscar equipamentos por modelo"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                        />
                    )}

                    <div className="flex flex-col gap-6">
                        {searchedEquipments.length > 0 ? (
                            searchedEquipments.map((equipment) => (
                                <EquipmentCard
                                    key={equipment.id}
                                    equipment={equipment}
                                    status="Aceito"
                                    onClick={() =>
                                        handleClickEquipmentCard(equipment)
                                    }
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
                                    ? "Nenhum equipamento registrado"
                                    : "Nenhum equipamento encontrado para o termo pesquisado"}
                            </Typography>
                        )}
                    </div>

                    <Button data-testid="btn-add-equipment">
                        Adicionar equipamento
                    </Button>
                </div>

                {selectedEquipment && (
                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        className="max-w-6xl"
                    >
                        <EquipmentDetails equipment={selectedEquipment} />
                    </Modal>
                )}
            </main>
        );
    }
}

export default UnitPage;
