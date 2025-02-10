import { toast } from "react-toastify";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { isErrorWithMessages } from "@/redux/services/helpers";
import { useDeleteUnitOperationMutation } from "@/redux/features/unitApiSlice";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";

const ModalDeleteUnit = () => {
    const dispatch = useAppDispatch();
    const { selectedUnit } = useAppSelector((state) => state.modal);

    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    async function handleDeleteUnit() {
        if (!selectedUnit?.id) {
            return toast.error("Unidade não encontrada");
        }
        try {
            const response = await deleteUnitOperation(selectedUnit.id);
            console.log(response);
            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }
                throw new Error("Um erro inesperado ocorreu.");
            }

            toast.success("Unidade deletada com sucesso!");
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
                Tem certeza que deseja excluir esta unidade?
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
                    onClick={handleDeleteUnit}
                    className="w-full mt-6"
                    data-testid="btn-confirm-delete-unit"
                >
                    Confirmar
                </Button>
            </div>
        </div>
    );
};

export default ModalDeleteUnit;
