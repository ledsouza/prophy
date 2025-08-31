enum VisitStatus {
    PENDING = "P",
    CONFIRMED = "C",
    FULFILLED = "F",
    UNFULFILLED = "U",
}

export const visitStatusLabel: Record<VisitStatus, string> = {
    [VisitStatus.PENDING]: "Pendente",
    [VisitStatus.CONFIRMED]: "Confirmado",
    [VisitStatus.FULFILLED]: "Realizado",
    [VisitStatus.UNFULFILLED]: "Não realizado",
};

export default VisitStatus;
