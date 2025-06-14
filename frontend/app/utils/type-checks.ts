import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";
import { UnitDTO } from "@/redux/features/unitApiSlice";

export function isUnit(entity: UnitDTO | EquipmentDTO): entity is UnitDTO {
    return "cnpj" in entity;
}
