"use client";

import { SubmitHandler, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { z } from "zod";

import { ProposalStatus } from "@/enums";
import { proposalSchema } from "@/schemas";

import type { ProposalDTO } from "@/redux/features/proposalApiSlice";
import { useUpdateProposalMutation } from "@/redux/features/proposalApiSlice";

import { Button } from "@/components/common";
import { Form, Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { closeModal } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";

const editProposalSchema = proposalSchema
    .pick({
        contact_name: true,
        contact_phone: true,
        email: true,
    })
    .extend({
        status: z.nativeEnum(ProposalStatus, {
            errorMap: () => ({ message: "Status é obrigatório." }),
        }),
    });

export type EditProposalFields = z.infer<typeof editProposalSchema>;

type EditProposalFormProps = {
    title?: string;
    description?: string;
    proposal: ProposalDTO;
};

const PROPOSAL_STATUS_OPTIONS = [
    { id: 1, value: "Aceito" },
    { id: 2, value: "Rejeitado" },
    { id: 3, value: "Pendente" },
];

const EditProposalForm = ({ title, description, proposal }: EditProposalFormProps) => {
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = useForm<EditProposalFields>({
        resolver: zodResolver(editProposalSchema),
        defaultValues: {
            contact_name: proposal.contact_name,
            contact_phone: proposal.contact_phone,
            email: proposal.email,
            status: proposal.status,
        },
    });

    const [updateProposal, { isLoading: isUpdatingProposal }] = useUpdateProposalMutation();

    const selectedStatus = watch("status");

    const onSubmit: SubmitHandler<EditProposalFields> = async (editData) => {
        try {
            await updateProposal({
                id: proposal.id,
                data: editData,
            }).unwrap();

            toast.success("Proposta atualizada com sucesso!");
            dispatch(closeModal());
        } catch (error) {
            console.error("Failed to update proposal:", error);
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const getSelectedStatusData = () => {
        switch (selectedStatus) {
            case ProposalStatus.ACCEPTED:
                return PROPOSAL_STATUS_OPTIONS[0];
            case ProposalStatus.REJECTED:
                return PROPOSAL_STATUS_OPTIONS[1];
            case ProposalStatus.PENDING:
                return PROPOSAL_STATUS_OPTIONS[2];
            default:
                return PROPOSAL_STATUS_OPTIONS[2]; // Default to Pendente
        }
    };

    const handleStatusChange = (selected: { id: number; value: string }) => {
        switch (selected.id) {
            case 1:
                setValue("status", ProposalStatus.ACCEPTED, { shouldValidate: true });
                break;
            case 2:
                setValue("status", ProposalStatus.REJECTED, { shouldValidate: true });
                break;
            case 3:
                setValue("status", ProposalStatus.PENDING, { shouldValidate: true });
                break;
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title || "Editar Proposta"}
                </Typography>

                {description && (
                    <Typography element="p" size="md" className="text-justify">
                        {description}
                    </Typography>
                )}

                <Input
                    {...register("contact_name")}
                    type="text"
                    errorMessage={errors.contact_name?.message}
                    placeholder="Digite o nome do contato"
                    label="Nome do Contato"
                    data-testid="proposal-contact-name-input"
                ></Input>

                <Input
                    {...register("contact_phone")}
                    type="text"
                    errorMessage={errors.contact_phone?.message}
                    placeholder="Digite o telefone do contato"
                    label="Telefone do Contato"
                    data-testid="proposal-contact-phone-input"
                ></Input>

                <Input
                    {...register("email")}
                    type="email"
                    errorMessage={errors.email?.message}
                    placeholder="Digite o e-mail do contato"
                    label="E-mail"
                    data-testid="proposal-email-input"
                ></Input>

                <Select
                    options={PROPOSAL_STATUS_OPTIONS}
                    selectedData={getSelectedStatusData()}
                    setSelect={handleStatusChange}
                    label="Situação"
                    dataTestId="proposal-status-select"
                />

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting || isUpdatingProposal}
                        onClick={() => dispatch(closeModal())}
                        variant="secondary"
                        data-testid="cancel-btn"
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || isUpdatingProposal}
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        {isSubmitting || isUpdatingProposal ? "Atualizando..." : "Atualizar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EditProposalForm;
