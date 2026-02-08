"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import { Button, Modal, Spinner } from "@/components/common";
import ComboBox, { ComboboxDataProps } from "@/components/forms/ComboBox";
import { Typography } from "@/components/foundation";
import Role from "@/enums/Role";
import { useListAllClientsQuery } from "@/redux/features/clientApiSlice";
import { useListAllUnitsQuery } from "@/redux/features/unitApiSlice";
import {
    useAddUserToClientMutation,
    useGetUserAssociationsQuery,
    useRemoveUserFromClientMutation,
    useSetUnitManagerMutation,
} from "@/redux/features/userAssociationsApiSlice";
import { handleApiError } from "@/redux/services/errorHandling";
import type {
    UserAssociationClient,
    UserAssociationUnit,
    UserAssociationsResponse,
} from "@/redux/types/userAssociations";
import type { UserDTO } from "@/types/user";

type Props = {
    isOpen: boolean;
    onClose: (value: boolean) => void;
    user: UserDTO | null;
};

const ManageUserAssociationsModal = ({ isOpen, onClose, user }: Props) => {
    const [selectedClient, setSelectedClient] = useState<ComboboxDataProps | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<ComboboxDataProps | null>(null);

    const userId = user?.id ?? null;
    const isGuUser = user?.role === Role.GU;

    const { data: associations, isLoading: isAssociationsLoading } = useGetUserAssociationsQuery(
        userId ?? 0,
        {
            skip: !userId,
        },
    );

    const { data: allClients, isLoading: isClientsLoading } = useListAllClientsQuery(undefined, {
        skip: !isOpen || !userId || isGuUser,
    });

    const { data: allUnits, isLoading: isUnitsLoading } = useListAllUnitsQuery(undefined, {
        skip: !isOpen || !userId || !isGuUser,
    });

    const [addUserToClient, { isLoading: isAddingClient }] = useAddUserToClientMutation();
    const [removeUserFromClient, { isLoading: isRemovingClient }] =
        useRemoveUserFromClientMutation();
    const [setUnitManager, { isLoading: isSettingUnitManager }] = useSetUnitManagerMutation();

    const clientOptions = useMemo<ComboboxDataProps[]>(
        () =>
            (allClients ?? []).map((client) => ({
                id: client.id,
                name: client.name,
            })),
        [allClients],
    );

    const unitOptions = useMemo<ComboboxDataProps[]>(
        () =>
            (allUnits ?? []).map((unit) => ({
                id: unit.id,
                name: unit.name,
            })),
        [allUnits],
    );

    const hasClients = (
        value: UserAssociationsResponse | undefined,
    ): value is { clients: UserAssociationClient[] } => !!value && "clients" in value;

    const hasUnits = (
        value: UserAssociationsResponse | undefined,
    ): value is { units: UserAssociationUnit[] } => !!value && "units" in value;

    const associatedClients = hasClients(associations) ? associations.clients : [];
    const associatedUnits = hasUnits(associations) ? associations.units : [];

    const isSubmitting = isAddingClient || isRemovingClient || isSettingUnitManager;

    const handleClose = () => {
        setSelectedClient(null);
        setSelectedUnit(null);
        onClose(false);
    };

    const handleAddClient = async () => {
        if (!userId || !selectedClient) return;
        if (associatedClients.some((client) => client.id == selectedClient.id)) {
            toast.info("Usuário já está associado a este cliente.");
            return;
        }
        try {
            await addUserToClient({ clientId: selectedClient.id, userId }).unwrap();
            toast.success("Cliente associado com sucesso.");
            setSelectedClient(null);
        } catch (error) {
            handleApiError(error, "Add client association");
        }
    };

    const handleRemoveClient = async (clientId: number) => {
        if (!userId) return;
        try {
            await removeUserFromClient({ clientId, userId }).unwrap();
            toast.success("Cliente removido com sucesso.");
        } catch (error) {
            handleApiError(error, "Remove client association");
        }
    };

    const handleAssignUnit = async () => {
        if (!selectedUnit || !userId) return;
        if (associatedUnits.some((unit) => unit.id == selectedUnit.id)) {
            toast.info("Usuário já está associado a esta unidade.");
            return;
        }
        try {
            await setUnitManager({
                unitId: selectedUnit.id,
                userId,
                associationUserId: userId,
            }).unwrap();
            toast.success("Unidade atribuída com sucesso.");
            setSelectedUnit(null);
        } catch (error) {
            const conflictMessage =
                error &&
                typeof error === "object" &&
                "status" in error &&
                error.status === 409 &&
                "data" in error &&
                typeof error.data === "object" &&
                error.data &&
                "current_unit_manager" in error.data
                    ? (error.data as { current_unit_manager?: { name?: string } })
                          .current_unit_manager?.name
                    : null;

            if (conflictMessage) {
                toast.warn(
                    `Esta unidade já possui gerente: ${conflictMessage}. Remova primeiro para associar outro.`,
                );
                return;
            }
            handleApiError(error, "Assign unit manager");
        }
    };

    const handleUnassignUnit = async (unitId: number) => {
        if (!userId) return;
        try {
            await setUnitManager({
                unitId,
                userId: null,
                associationUserId: userId,
            }).unwrap();
            toast.success("Unidade desassociada com sucesso.");
        } catch (error) {
            handleApiError(error, "Unassign unit manager");
        }
    };

    const isLoading =
        isAssociationsLoading || (isGuUser ? isUnitsLoading : isClientsLoading) || !user;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl mx-6 p-6">
            <div data-cy="gp-users-associations-modal">
                <Typography element="h3" size="title3" className="font-semibold mb-2">
                    Gerenciar associações
                </Typography>
                <Typography element="p" size="sm" className="text-gray-secondary mb-4">
                    {user
                        ? `Usuário: ${user.name}`
                        : "Selecione um usuário para gerenciar as associações."}
                </Typography>

                {isLoading ? (
                    <Spinner />
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {isGuUser ? (
                                <ComboBox
                                    data={unitOptions}
                                    selectedValue={selectedUnit}
                                    onChange={setSelectedUnit}
                                    placeholder="Digite o nome da unidade"
                                    dataCy="gp-users-associations-unit-combobox"
                                >
                                    Unidade
                                </ComboBox>
                            ) : (
                                <ComboBox
                                    data={clientOptions}
                                    selectedValue={selectedClient}
                                    onChange={setSelectedClient}
                                    placeholder="Digite o nome do cliente"
                                    dataCy="gp-users-associations-combobox"
                                >
                                    Cliente
                                </ComboBox>
                            )}

                            <Button
                                type="button"
                                onClick={isGuUser ? handleAssignUnit : handleAddClient}
                                disabled={
                                    isGuUser
                                        ? !selectedUnit || isSubmitting
                                        : !selectedClient || isSubmitting
                                }
                                dataCy={
                                    isGuUser
                                        ? "gp-users-associations-assign"
                                        : "gp-users-associations-add"
                                }
                            >
                                {isGuUser ? "Associar unidade" : "Associar cliente"}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <Typography element="h4" size="md" className="font-semibold">
                                {isGuUser ? "Unidades associadas" : "Clientes associados"}
                            </Typography>

                            {(isGuUser ? associatedUnits : associatedClients).length === 0 ? (
                                <Typography element="p" size="sm" className="text-gray-secondary">
                                    Nenhuma associação encontrada.
                                </Typography>
                            ) : (
                                <div className="space-y-2">
                                    {(isGuUser ? associatedUnits : associatedClients).map(
                                        (association) => (
                                            <div
                                                key={association.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                                            >
                                                <Typography element="p" size="sm">
                                                    {association.name}
                                                </Typography>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    onClick={() =>
                                                        isGuUser
                                                            ? handleUnassignUnit(association.id)
                                                            : handleRemoveClient(association.id)
                                                    }
                                                    disabled={isSubmitting}
                                                    dataCy={
                                                        isGuUser
                                                            ? `gp-users-associations-unassign-unit-${association.id}`
                                                            : `gp-users-associations-remove-client-${association.id}`
                                                    }
                                                >
                                                    Desassociar
                                                </Button>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleClose}
                                dataCy="gp-users-associations-close"
                            >
                                Fechar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ManageUserAssociationsModal;
