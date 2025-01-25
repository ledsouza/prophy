import Image from "next/image";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";

import notFound from "@/assets/image-not-found.png";
import { XCircle } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";

type EquipmentDetailsProps = {
    equipment: EquipmentDTO;
    onClose: () => void;
};

function EquipmentDetails({ equipment, onClose }: EquipmentDetailsProps) {
    return (
        <div className="flex flex-col" data-testid="equipment-details">
            <button
                onClick={onClose}
                className="absolute right-1 top-1 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                data-testid="btn-close-modal"
                aria-label="Fechar modal"
            >
                <XCircle size={32} className="text-primary" />
            </button>
            <div className="relative w-full h-[700px]">
                <Image
                    src={
                        equipment.equipment_photo
                            ? process.env.NEXT_PUBLIC_HOST +
                              equipment.equipment_photo
                            : notFound
                    }
                    alt="Imagem do equipamento"
                    fill={true}
                    className="shadow-lg ring-2"
                    style={{
                        objectFit: "contain",
                    }}
                />
            </div>
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

                {equipment.label_photo && (
                    <Image
                        src={
                            process.env.NEXT_PUBLIC_HOST + equipment.label_photo
                        }
                        alt="Rótulo do equipamento"
                        width={200}
                        height={200}
                        className="ring-1 shadow-md rounded-md"
                        style={{
                            objectFit: "contain",
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default EquipmentDetails;
