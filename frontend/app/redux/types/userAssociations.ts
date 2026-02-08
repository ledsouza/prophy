export type UserAssociationClient = {
    id: number;
    name: string;
};

export type UserAssociationUnit = {
    id: number;
    name: string;
};

export type UserAssociationsResponse =
    | {
          clients: UserAssociationClient[];
      }
    | {
          units: UserAssociationUnit[];
      };

export type AddUserToClientPayload = {
    clientId: number;
    userId: number;
};

export type RemoveUserFromClientPayload = {
    clientId: number;
    userId: number;
};

export type SetUnitManagerPayload = {
    unitId: number;
    userId: number | null;
    associationUserId: number;
};
