import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { UnitDTO, UnitOperationDTO } from "../features/unitApiSlice";
import {
    EquipmentDTO,
    EquipmentOperationDTO,
} from "../features/equipmentApiSlice";

/**
 * Type predicate to narrow an unknown error to `FetchBaseQueryError`
 */
export function isFetchBaseQueryError(
    error: unknown
): error is FetchBaseQueryError {
    return typeof error === "object" && error != null && "status" in error;
}

/**
 * Type predicate to narrow an unknown error to an object with a string 'message' property
 */
export function isErrorWithMessage(
    error: unknown
): error is { data: { messages: string[] } } {
    return (
        typeof error === "object" &&
        error != null &&
        "data" in error &&
        typeof (error as any).data === "object"
    );
}

export function isResponseError(
    error: unknown
): error is { error: { data: { message: string }; status: number } } {
    return (
        typeof error === "object" &&
        error != null &&
        "error" in error &&
        typeof (error as any).error === "object" &&
        "data" in (error as any).error &&
        "status" in (error as any).error
    );
}

export const getEquipmentsCount = (
    unit: UnitDTO,
    equipments: EquipmentDTO[] | undefined
) => {
    if (equipments) {
        return equipments.filter((equipment) => equipment.unit === unit.id)
            .length;
    } else {
        return 0;
    }
};

export const getUnitOperation = (
    unit: UnitDTO,
    unitsOperations: UnitOperationDTO[] | undefined
) => {
    // Add operations has the same id of the entity
    // because they don't have a original entity associated with them
    const AddUnitOperation = unitsOperations?.find(
        (operation) => operation.id === unit.id
    );

    if (AddUnitOperation) {
        return AddUnitOperation;
    }

    // Return for other types of operations
    // because they have a original entity associated with them
    return unitsOperations?.find(
        (operation) => operation.original_unit === unit.id
    );
};

export const getEquipmentOperation = (
    equipment: EquipmentDTO,
    equipmentsOperations: EquipmentOperationDTO[] | undefined
) => {
    // Add operations has the same id of the entity
    // because they don't have a original entity associated with them
    const AddEquipmentOperation = equipmentsOperations?.find(
        (operation) => operation.id === equipment.id
    );

    if (AddEquipmentOperation) {
        return AddEquipmentOperation;
    }

    // Return for other types of operations
    // because they have a original entity associated with them
    return equipmentsOperations?.find(
        (operation) => operation.original_equipment === equipment.id
    );
};
