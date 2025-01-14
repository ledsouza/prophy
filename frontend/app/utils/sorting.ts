import { OperationStatus } from "@/enums";

export function sortByOperationStatus<T>(
    entities: T[],
    statusOrder: Record<OperationStatus, number>,
    handleStatus: (entity: T) => OperationStatus
): T[] {
    return entities.sort((a, b) => {
        const statusA = handleStatus(a);
        const statusB = handleStatus(b);
        return statusOrder[statusA] - statusOrder[statusB];
    });
}
