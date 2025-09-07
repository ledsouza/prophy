"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import type { ServiceOrderDTO } from "@/redux/features/visitApiSlice";

import { serviceOrderSchema } from "@/schemas";

import { Form, FormButtons, Input, MultiSelect, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { useListAllEquipmentsQuery } from "@/redux/features/equipmentApiSlice";
import clsx from "clsx";

type ServiceOrderFields = z.infer<typeof serviceOrderSchema>;

type ServiceOrderFormProps = {
    serviceOrder: ServiceOrderDTO;
    unitId: number;
    disabled?: boolean;
    onCancel?: () => void;
};

/**
 * Renders a form to view or edit a Service Order.
 *
 * Integrates react-hook-form with zod validation (serviceOrderSchema). When `disabled` is true,
 * fields are presented in read-only mode and action buttons are hidden. Equipment options are
 * fetched via useListAllEquipmentsQuery and filtered by the provided `unitId`. Submitting currently
 * shows an informational toast because the backend update endpoint is not available.
 *
 * @param props Component props.
 * @param props.serviceOrder Initial data to populate the form and for read-only display.
 * @param props.unitId Unit identifier used to filter available equipments in the selector.
 * @param props.disabled If true, renders the form in read-only mode (default: false).
 * @param props.onCancel Optional callback executed when the user cancels.
 * @returns Form element wrapping the fields and, when editable, action buttons.
 *
 * @example
 * <ServiceOrderForm
 *   serviceOrder={serviceOrder}
 *   unitId={unitId}
 *   disabled={false}
 *   onCancel={() => console.log('Canceled')}
 * />
 */
const ServiceOrderForm = ({
    serviceOrder,
    unitId,
    disabled = false,
    onCancel,
}: ServiceOrderFormProps) => {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ServiceOrderFields>({
        resolver: zodResolver(serviceOrderSchema),
        defaultValues: {
            subject: serviceOrder.subject,
            description: serviceOrder.description,
            conclusion: serviceOrder.conclusion,
            equipments: serviceOrder.equipments || [],
        },
    });

    const { data: allEquipments = [] } = useListAllEquipmentsQuery();
    const unitEquipments = Array.isArray(allEquipments)
        ? allEquipments.filter((e) => e.unit === unitId)
        : [];
    const equipmentOptions = unitEquipments.map((e) => {
        const nameParts = [e.manufacturer, e.model].filter(Boolean);
        const label = nameParts.length > 0 ? nameParts.join(" ") : `Equipamento #${e.id}`;
        return { id: e.id, value: `${label}` };
    });

    const onSubmit: SubmitHandler<ServiceOrderFields> = async () => {
        // TODO: There is no backend API to update ServiceOrder in the current codebase.
        toast.info("Atualização da Ordem de Serviço indisponível no momento.");
    };

    const handleCancel = () => {
        onCancel?.();
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 space-y-4">
                <Input
                    {...register("subject")}
                    type="text"
                    disabled={disabled}
                    placeholder="Assunto da ordem de serviço"
                    errorMessage={errors.subject?.message}
                    dataTestId="service-order-subject"
                >
                    Assunto
                </Input>

                <Textarea
                    {...register("description")}
                    rows={6}
                    disabled={disabled}
                    placeholder="Descrição detalhada"
                    errorMessage={errors.description?.message}
                >
                    Descrição
                </Textarea>

                <Textarea
                    {...register("conclusion")}
                    rows={6}
                    disabled={disabled}
                    placeholder="Conclusão do serviço"
                    errorMessage={errors.conclusion?.message}
                >
                    Conclusão
                </Textarea>

                <div>
                    {disabled ? (
                        <>
                            <Typography element="p" size="sm" className="font-medium mb-1">
                                Equipamentos relacionados
                            </Typography>
                            {Array.isArray(serviceOrder.equipments) &&
                            serviceOrder.equipments.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {serviceOrder.equipments.map((id: number) => {
                                        const e = Array.isArray(allEquipments)
                                            ? allEquipments.find((eq) => eq.id === id)
                                            : undefined;

                                        const model = e?.model?.toString().trim();
                                        const manufacturer = e?.manufacturer?.toString().trim();
                                        const hasBoth = Boolean(model && manufacturer);

                                        if (!hasBoth) {
                                            console.error(
                                                "[ServiceOrderForm] Equipment missing data (model and/or manufacturer)",
                                                {
                                                    equipmentId: id,
                                                    equipment: e ?? null,
                                                    missingModel: !model,
                                                    missingManufacturer: !manufacturer,
                                                }
                                            );
                                        }

                                        const label = hasBoth
                                            ? `${manufacturer} ${model} `
                                            : `Dados de equipamento incompletos (ID #${id})`;

                                        return (
                                            <span
                                                key={id}
                                                className={clsx(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    hasBoth
                                                        ? "bg-quaternary/20 text-gray-primary ring-quaternary/40"
                                                        : "bg-danger/10 text-danger ring-danger/30"
                                                )}
                                            >
                                                {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Typography element="p" size="md" className="text-text-placeholder">
                                    Nenhum equipamento vinculado.
                                </Typography>
                            )}
                        </>
                    ) : (
                        <MultiSelect
                            label="Equipamentos relacionados"
                            options={equipmentOptions}
                            value={watch("equipments") || []}
                            onChange={(ids) =>
                                setValue("equipments", ids, { shouldValidate: true })
                            }
                            dataTestId="service-order-equipments"
                        />
                    )}
                </div>
            </div>

            {!disabled && (
                <div className="mt-4">
                    <FormButtons
                        isSubmitting={isSubmitting}
                        needReview={false}
                        onCancel={handleCancel}
                    />
                </div>
            )}
        </Form>
    );
};

export default ServiceOrderForm;
