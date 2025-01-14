import { OperationStatus } from "@/enums";

export const defaultOperationStatusOrder = {
    [OperationStatus.ACCEPTED]: 1,
    [OperationStatus.REVIEW]: 2,
    [OperationStatus.REJECTED]: 3,
};
