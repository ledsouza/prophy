import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";

type EquipmentDetailsProps = {
    equipment: EquipmentDTO;
};

function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
    return <div>Equipment {equipment.id}</div>;
}

export default EquipmentDetails;
