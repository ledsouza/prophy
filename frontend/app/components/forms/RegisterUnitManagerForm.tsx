import { z } from "zod";
import { unitManagerSchema } from "@/schemas";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button } from "../common";
import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { useRegisterUnitManagerMutation } from "@/redux/features/authApiSlice";
import { handleApiError } from "@/redux/services/errorHandling";

export type RegisterFields = z.infer<typeof unitManagerSchema>;

type RegisterUnitManagerFormProps = {
    unitID: number;
    title?: string;
    description?: string;
};

const RegisterUnitManagerForm = ({ unitID, title, description }: RegisterUnitManagerFormProps) => {
    const dispatch = useAppDispatch();
    const [registerUnitManager] = useRegisterUnitManagerMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFields>({
        resolver: zodResolver(unitManagerSchema),
    });

    const onSubmit: SubmitHandler<RegisterFields> = async (data) => {
        try {
            const result = await registerUnitManager({
                ...data,
                unit_id: unitID,
            }).unwrap();

            toast.success(
                `Gerente de unidade registrado com sucesso. Um email foi enviado para ${result.email}`
            );
            dispatch(closeModal());
        } catch (error) {
            handleApiError(error, "Registration error");
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title}
                </Typography>

                <Typography element="p" size="md" className="text-justify">
                    {description}
                </Typography>

                <Input
                    {...register("name")}
                    type="text"
                    errorMessage={errors.name?.message}
                    placeholder="Digite o nome completo do gerente de unidade"
                    data-testid="unit-manager-name-input"
                >
                    Nome
                </Input>
                <Input
                    {...register("cpf")}
                    type="text"
                    errorMessage={errors.cpf?.message}
                    placeholder="Digite o CPF do gerente de unidade"
                    data-testid="unit-manager-cpf-input"
                >
                    CPF
                </Input>
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="Digite o email do gerente de unidade"
                    data-testid="unit-manager-email-input"
                >
                    E-mail
                </Input>
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="Digite o número de celular do gerente de unidade"
                    data-testid="unit-manager-phone-input"
                >
                    Número do celular
                </Input>

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => dispatch(closeModal())}
                        variant="secondary"
                        className="w-full"
                        data-testid="cancel-btn"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        Atribuir
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default RegisterUnitManagerForm;
