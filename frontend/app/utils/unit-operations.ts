import { OperationStatus, OperationType } from "@/enums";
import Role from "@/enums/Role";

import type {
    UnitDTO,
    UnitOperationDTO,
} from "@/redux/features/unitApiSlice";

const REVIEWER_ROLES = new Set<Role>([Role.FMI, Role.GP]);

export type UnitListItem = {
    unit: UnitDTO;
    operation?: UnitOperationDTO;
};

export function canReviewOperations(role?: Role): boolean {
    if (role === undefined) {
        return false;
    }

    return REVIEWER_ROLES.has(role);
}

export function getUnitOperationForUnit(
    unit: UnitDTO,
    unitOperations: UnitOperationDTO[] | undefined
): UnitOperationDTO | undefined {
    const addUnitOperation = unitOperations?.find(
        (operation) => operation.id === unit.id
    );

    if (addUnitOperation !== undefined) {
        return addUnitOperation;
    }

    return unitOperations?.find(
        (operation) => operation.original_unit === unit.id
    );
}

export function buildUnitListItems(
    units: UnitDTO[] | undefined,
    unitOperations: UnitOperationDTO[] | undefined
): UnitListItem[] {
    const acceptedUnits = units ?? [];
    const operations = unitOperations ?? [];
    const items: UnitListItem[] = acceptedUnits.map((unit) => ({
        unit,
        operation: getUnitOperationForUnit(unit, operations),
    }));

    const acceptedUnitIds = new Set(acceptedUnits.map((unit) => unit.id));
    const pendingAddOperations = operations.filter(
        (operation) =>
            operation.operation_type === OperationType.ADD &&
            operation.operation_status !== OperationStatus.ACCEPTED &&
            !acceptedUnitIds.has(operation.id)
    );

    return [
        ...items,
        ...pendingAddOperations.map((operation) => ({
            unit: operation,
            operation,
        })),
    ];
}