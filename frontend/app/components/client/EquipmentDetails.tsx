import Image from "next/image";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";

import placeholderImage from "@/assets/placeholder-image.jpg";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";

type EquipmentDetailsProps = {
    equipment: EquipmentDTO;
};

function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
    return (
        <div>
            <Image
                src={placeholderImage}
                alt="Imagem do equipamento"
                style={{
                    objectFit: "cover",
                }}
            />
            <div className="m-6 flex flex-row justify-around">
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
                    <Button variant="secondary" data-testid="btn-edit">
                        Editar
                    </Button>
                    <Button variant="danger" data-testid="btn-delete">
                        Deletar
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default EquipmentDetails;
