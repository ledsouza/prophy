import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { equipmentSchema } from "@/schemas";

import { useCreateAddEquipmentOperationMutation } from "@/redux/features/equipmentApiSlice";
import { isErrorWithMessages } from "@/redux/services/helpers";

import { Button } from "@/components/common";
import { Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";

export type AddEquipmentFields = z.infer<typeof equipmentSchema>;

type AddEquipmentFormProps = {
    unitId: number;
    setIsModalOpen: (value: boolean) => void;
};

const AddEquipmentForm = ({
    unitId,
    setIsModalOpen,
}: AddEquipmentFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AddEquipmentFields>({
        resolver: zodResolver(equipmentSchema),
    });

    const [createAddEquipmentOperation] =
        useCreateAddEquipmentOperationMutation();

    const onSubmit: SubmitHandler<AddEquipmentFields> = async (data) => {
        const formData = new FormData();

        // Handle text fields
        formData.append("modality", data.modality);
        formData.append("manufacturer", data.manufacturer);
        formData.append("model", data.model);
        formData.append("series_number", data.series_number);
        formData.append("anvisa_registry", data.anvisa_registry);
        formData.append("unit", unitId.toString());

        // Handle file uploads - check if files exist before appending
        if (data.equipment_photo?.[0]) {
            formData.append("equipment_photo", data.equipment_photo[0]);
        }

        if (data.label_photo?.[0]) {
            formData.append("label_photo", data.label_photo[0]);
        }

        try {
            const response = await createAddEquipmentOperation(formData);
            console.log("Response in AddEquipmentForm => ", response);

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    toast.error(response.error.data.messages[0]);
                    return;
                }
                return toast.error(
                    "Algo deu errado. Tente novamente mais tarde."
                );
            }

            toast.success("Requisição enviada com sucesso!");
            setIsModalOpen(false);
        } catch (error) {
            console.log("Error in AddEquipmentForm => ", error);
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                >
                    Informe os dados do equipamento
                </Typography>
                <Typography element="p" size="md" className="text-justify">
                    Por favor, preencha os campos abaixo com as informações do
                    equipamento, certificando-se de preencher as informações
                    corretamente. Após a submissão, o formulário será enviado
                    para análise de um físico médico responsável, que fará a
                    revisão e validação das informações fornecidas.
                </Typography>

                <Input
                    {...register("modality")}
                    type="text"
                    errorMessage={errors.modality?.message}
                    placeholder="Digite o nome da modalidade"
                    data-testid="equipment-modality-input"
                >
                    Modalidade
                </Input>

                <Input
                    {...register("manufacturer")}
                    type="text"
                    errorMessage={errors.manufacturer?.message}
                    placeholder="Digite o nome do fabricante"
                    data-testid="equipment-manufacturer-input"
                >
                    Fabricante
                </Input>

                <Input
                    {...register("model")}
                    type="text"
                    errorMessage={errors.model?.message}
                    placeholder="Digite o nome do modelo"
                    data-testid="equipment-model-input"
                >
                    Modelo
                </Input>

                <Input
                    {...register("series_number")}
                    type="text"
                    errorMessage={errors.series_number?.message}
                    placeholder="Digite o número de série, se houver"
                    data-testid="equipment-series-number-input"
                >
                    Número de série
                </Input>

                <Input
                    {...register("anvisa_registry")}
                    type="text"
                    errorMessage={errors.anvisa_registry?.message}
                    placeholder="Digite o registro na ANVISA, se houver"
                    data-testid="equipment-anvisa-registry-input"
                >
                    Registro na ANVISA
                </Input>

                <Input
                    {...register("equipment_photo")}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.equipment_photo?.message}
                    data-testid="equipment-photo-input"
                >
                    Foto do equipamento
                </Input>

                <Input
                    {...register("label_photo")}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.label_photo?.message}
                    data-testid="equipment-label-input"
                >
                    Foto do rótulo do equipamento
                </Input>

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsModalOpen(false)}
                        variant="secondary"
                        data-testid="cancel-btn"
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        Requisitar
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default AddEquipmentForm;
