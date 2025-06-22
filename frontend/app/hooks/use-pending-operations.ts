import { useMemo } from "react";
import { OperationStatus } from "@/enums";
import {
    useListAllClientsOperationsQuery,
    ClientOperationDTO,
} from "@/redux/features/clientApiSlice";
import { useListAllUnitsOperationsQuery, UnitOperationDTO } from "@/redux/features/unitApiSlice";
import {
    useListAllEquipmentsOperationsQuery,
    EquipmentOperationDTO,
} from "@/redux/features/equipmentApiSlice";

/**
 * Custom hook to efficiently check if there are any pending operations
 * across clients, units, and equipment.
 *
 * @param enabled - Whether to enable the queries (default: true)
 * @returns Object with hasPendingOperations boolean and isLoading state
 */
function usePendingOperations(enabled: boolean = true) {
    // Fetch all operations data
    const {
        data: clientOperations = [],
        isLoading: isLoadingClients,
        error: clientError,
    } = useListAllClientsOperationsQuery(undefined, { skip: !enabled });

    const {
        data: unitOperations = [],
        isLoading: isLoadingUnits,
        error: unitError,
    } = useListAllUnitsOperationsQuery(undefined, { skip: !enabled });

    const {
        data: equipmentOperations = [],
        isLoading: isLoadingEquipments,
        error: equipmentError,
    } = useListAllEquipmentsOperationsQuery(undefined, { skip: !enabled });

    // Calculate if there are pending operations
    const hasPendingOperations = useMemo(() => {
        if (!enabled) return false;

        // Check for pending operations in any of the operation types
        const hasClientPending = clientOperations.some(
            (op: ClientOperationDTO) => op.operation_status === OperationStatus.REVIEW
        );

        const hasUnitPending = unitOperations.some(
            (op: UnitOperationDTO) => op.operation_status === OperationStatus.REVIEW
        );

        const hasEquipmentPending = equipmentOperations.some(
            (op: EquipmentOperationDTO) => op.operation_status === OperationStatus.REVIEW
        );

        return hasClientPending || hasUnitPending || hasEquipmentPending;
    }, [clientOperations, unitOperations, equipmentOperations, enabled]);

    const isLoading = isLoadingClients || isLoadingUnits || isLoadingEquipments;
    const hasError = clientError || unitError || equipmentError;

    return {
        hasPendingOperations,
        isLoading,
        hasError,
    };
}

export default usePendingOperations;
