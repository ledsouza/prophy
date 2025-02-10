import { toast } from "react-toastify";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { isErrorWithMessages } from "@/redux/services/helpers";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { useDeleteEquipmentOperationMutation } from "@/redux/features/equipmentApiSlice";

const ModalDeleteEquipment = () => {
    const dispatch = useAppDispatch();
    const { selectedEquipment } = useAppSelector((state) => state.modal);

    const [deleteEquipment] = useDeleteEquipmentOperationMutation();

    async function handleDeleteEquipment() {
        if (!selectedEquipment?.id) {
            return toast.error("Equipamento não encontrado.");
        }
        try {
            const response = await deleteEquipment(selectedEquipment.id);
            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }
                throw new Error("Um erro inesperado ocorreu.");
            }

            toast.success("Equipamento deletado com sucesso!");
            dispatch(closeModal());
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Algo deu errado. Tente novamente mais tarde."
            );
        }
    }

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Typography element="h2" size="title2" className="mb-6">
                Tem certeza que deseja excluir este equipamento?
            </Typography>

            <div className="flex flex-row gap-2">
                <Button
                    onClick={() => {
                        dispatch(closeModal());
                    }}
                    className="w-full mt-6"
                    data-testid="btn-cancel-delete-unit"
                >
                    Cancelar
                </Button>

                <Button
                    variant="danger"
                    onClick={handleDeleteEquipment}
                    className="w-full mt-6"
                    data-testid="btn-confirm-delete-unit"
                >
                    Confirmar
                </Button>
            </div>
        </div>
    );
};

export default ModalDeleteEquipment;
