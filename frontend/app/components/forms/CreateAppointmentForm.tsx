"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { AppointmentType } from "@/enums";
import { APPOINTMENT_TYPE_OPTIONS, getAppointmentTypeById } from "@/constants/appointment";
import { useCreateAppointmentMutation } from "@/redux/features/appointmentApiSlice";
import { useListAllClientsQuery } from "@/redux/features/clientApiSlice";
import { closeModal } from "@/redux/features/modalSlice";
import { useListAllUnitsQuery } from "@/redux/features/unitApiSlice";
import { useAppDispatch } from "@/redux/hooks";
import { handleApiError } from "@/redux/services/errorHandling";
import appointmentGlobalCreateSchema from "@/schemas/appointment-global-create-schema";
import type { CreateAppointmentPayload } from "@/types/appointment";
import { child } from "@/utils/logger";

import { Button, Spinner } from "@/components/common";
import { ComboBox, Form, Input, Select, Textarea } from "@/components/forms";
import type { ComboboxDataProps } from "@/components/forms/ComboBox";
import type { SelectData } from "@/components/forms/Select";
import { Typography } from "@/components/foundation";

const log = child({ component: "CreateAppointmentForm" });

export type CreateAppointmentFields = z.infer<typeof appointmentGlobalCreateSchema>;

type CreateAppointmentFormProps = {
    title?: string;
    description?: string;
};

const APPOINTMENT_TYPE_SELECT_OPTIONS = APPOINTMENT_TYPE_OPTIONS.map((opt) => ({
    id: opt.id,
    value: opt.label,
}));

const CreateAppointmentForm = ({ title, description }: CreateAppointmentFormProps) => {
    const dispatch = useAppDispatch();

    const [selectedClient, setSelectedClient] = useState<ComboboxDataProps | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
        resetField,
    } = useForm<CreateAppointmentFields>({
        resolver: zodResolver(appointmentGlobalCreateSchema),
        defaultValues: {
            type: AppointmentType.IN_PERSON,
        },
    });

    const { data: clients, isLoading: isLoadingClients } = useListAllClientsQuery();
    const { data: allUnits, isLoading: isLoadingUnits } = useListAllUnitsQuery();

    const [createAppointment] = useCreateAppointmentMutation();

    const selectedAppointmentType = watch("type");
    const selectedUnitId = watch("unit");

    const clientsData = useMemo(() => {
        if (!clients) return [];
        return clients.map((client) => ({
            id: client.id,
            name: client.name,
        }));
    }, [clients]);

    const unitsData = useMemo(() => {
        if (!allUnits || !selectedClient) return [];
        return allUnits
            .filter((unit) => unit.client === selectedClient.id)
            .map((unit) => ({
                id: unit.id,
                value: unit.name,
            }));
    }, [allUnits, selectedClient]);

    const selectedUnitData = useMemo(() => {
        if (!selectedUnitId) return null;
        return unitsData.find((unit) => unit.id === selectedUnitId) || null;
    }, [selectedUnitId, unitsData]);

    const onSubmit: SubmitHandler<CreateAppointmentFields> = async (data) => {
        try {
            const payload: CreateAppointmentPayload = {
                unit: data.unit,
                date: data.date,
                type: data.type,
                contact_name: data.contact_name,
                contact_phone: data.contact_phone,
            };

            log.info({ unitId: data.unit, clientId: data.client }, "Creating appointment");

            const response = await createAppointment(payload);

            if (response.error) {
                handleApiError(response.error, "Appointment creation error");
                return;
            }

            toast.success("Agendamento criado com sucesso!");
            dispatch(closeModal());
        } catch (error) {
            log.error(
                { error: (error as Error)?.message ?? String(error) },
                "Unexpected error creating appointment"
            );
            handleApiError(error, "Unexpected error creating appointment");
        }
    };

    const getSelectedAppointmentTypeData = () => {
        const option =
            APPOINTMENT_TYPE_OPTIONS.find((opt) => opt.type === selectedAppointmentType) ??
            APPOINTMENT_TYPE_OPTIONS[0];

        return {
            id: option.id,
            value: option.label,
        };
    };

    const handleAppointmentTypeChange = (selected: SelectData | null) => {
        if (!selected) {
            return;
        }
        const typeValue = getAppointmentTypeById(selected.id);
        setValue("type", typeValue, { shouldValidate: true });
    };

    const handleClientChange = (client: ComboboxDataProps | null) => {
        setSelectedClient(client);

        if (!client) {
            resetField("client");
            resetField("unit");
            return;
        }

        setValue("client", client.id, { shouldValidate: true });
        setValue("unit", 0);
    };

    const handleUnitChange = (unit: SelectData | null) => {
        if (!unit) {
            resetField("unit");
            return;
        }
        setValue("unit", unit.id, { shouldValidate: true });
    };

    if (isLoadingClients || isLoadingUnits) {
        return (
            <div className="m-6 flex flex-col items-center gap-4">
                <Spinner />
                <Typography element="p" size="md" className="text-center">
                    Carregando dados...
                </Typography>
            </div>
        );
    }

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title || "Criar Agendamento"}
                </Typography>

                {description && (
                    <Typography element="p" size="md" className="text-justify">
                        {description}
                    </Typography>
                )}

                <ComboBox
                    data={clientsData}
                    errorMessage={errors.client?.message ?? ""}
                    placeholder="Digite o nome do cliente"
                    selectedValue={selectedClient}
                    onChange={handleClientChange}
                    data-testid="appointment-client-combobox"
                >
                    Cliente
                </ComboBox>

                <Select
                    options={unitsData}
                    selectedData={selectedUnitData}
                    setSelect={handleUnitChange}
                    label="Unidade"
                    disabled={!selectedClient || unitsData.length === 0}
                    placeholder={
                        !selectedClient
                            ? "Selecione um cliente primeiro"
                            : unitsData.length === 0
                              ? "Nenhuma unidade disponível"
                              : "Selecione uma unidade"
                    }
                    dataTestId="appointment-unit-select"
                />
                {errors.unit && (
                    <div data-testid="unit-validation-error" className="text-danger -mt-2 text-sm">
                        {errors.unit.message}
                    </div>
                )}

                <Input
                    {...register("date")}
                    type="datetime-local"
                    errorMessage={errors.date?.message}
                    label="Data e Hora"
                    data-testid="appointment-date-input"
                />

                <Select
                    options={APPOINTMENT_TYPE_SELECT_OPTIONS}
                    selectedData={getSelectedAppointmentTypeData()}
                    setSelect={handleAppointmentTypeChange}
                    label="Tipo de Agendamento"
                    dataTestId="appointment-type-select"
                />

                <Input
                    {...register("contact_name")}
                    type="text"
                    errorMessage={errors.contact_name?.message}
                    placeholder="Digite o nome do contato"
                    label="Nome do Contato"
                    data-testid="appointment-contact-name-input"
                />

                <Input
                    {...register("contact_phone")}
                    type="text"
                    errorMessage={errors.contact_phone?.message}
                    placeholder="Digite o telefone do contato"
                    label="Telefone do Contato"
                    data-testid="appointment-contact-phone-input"
                />

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => dispatch(closeModal())}
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
                        {isSubmitting ? "Criando..." : "Criar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CreateAppointmentForm;
