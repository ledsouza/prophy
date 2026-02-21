/**
 Read vs write models for Service Orders:
 - ServiceOrderDTO: read (API output).
 - Payloads: write (client input).
 Keeps immutable/server-managed fields (id) out of writes and allows different create vs update shapes.
*/

export type ServiceOrderDTO = {
    id: number;
    subject: string;
    description: string;
    conclusion: string;
    updates?: string | null;
    equipments: number[];
};

export type ServiceOrderBase = Pick<
    ServiceOrderDTO,
    "subject" | "description" | "conclusion" | "equipments"
>;

export type CreateServiceOrderPayload = ServiceOrderBase & {
    appointment: number;
};

// Allow partial updates of core fields and independent updates to the "updates" field
export type UpdateServiceOrderPayload = Partial<ServiceOrderBase> & {
    updates?: string | null;
};
