import { OperationStatus, OperationType } from "@/enums";

/**
 * Checks if a component should be hidden based on operation status and type
 * Used by both EquipmentCard and UnitCard components
 *
 * @param isStaff - Whether the current user is staff (FMI or GP role)
 * @param operation - The operation object (equipment or unit operation)
 * @returns boolean - True if the component should be hidden, false otherwise
 */
export function shouldHideRejectedAddOperation(
    isStaff: boolean,
    operation:
        | {
              operation_status?: OperationStatus;
              operation_type?: OperationType;
          }
        | undefined
): boolean {
    return (
        isStaff &&
        operation?.operation_status === OperationStatus.REJECTED &&
        operation.operation_type === OperationType.ADD
    );
}
