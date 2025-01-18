import Image from "next/image";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";

import notFound from "@/assets/image-not-found.png";
import { XCircle } from "@phosphor-icons/react";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";

type EquipmentDetailsProps = {
    equipment: EquipmentDTO;
    onClose: () => void;
};

function EquipmentDetails({ equipment, onClose }: EquipmentDetailsProps) {
    return (
        <div data-testid="equipment-details">
            <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                data-testid="btn-close-modal"
                aria-label="Fechar modal"
            >
                <XCircle size={32} className="text-primary" />
            </button>
            <Image
                src={
                    equipment.equipment_photo
                        ? process.env.NEXT_PUBLIC_HOST +
                          equipment.equipment_photo
                        : notFound
                }
                alt="Imagem do equipamento"
                width={equipment.equipment_photo ? 1200 : 600}
                height={equipment.equipment_photo ? 1200 : 600}
                className="flex justify-self-center"
                style={{
                    objectFit: "contain",
                }}
            />
            <div className="m-6 flex flex-col gap-2 sm:flex-row justify-around">
                <Typography size="md">
                    <b>Modelo:</b> {equipment.model}
                    <br />
                    <b>Fabricante:</b> {equipment.manufacturer}
                    <br />
                    <b>Modalidade:</b> {equipment.modality}
                </Typography>

                <Typography size="md">
                    <b>Número de Série:</b> {equipment.series_number}
                    <br />
                    <b>Registro da Anvisa:</b> {equipment.anvisa_registry}
                </Typography>

                <div className="flex flex-col gap-2">
                    <Button
                        variant="secondary"
                        data-testid="btn-edit-equipment"
                    >
                        Editar
                    </Button>
                    <Button variant="danger" data-testid="btn-delete-equipment">
                        Remover
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default EquipmentDetails;
