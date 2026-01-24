"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import type { ServiceOrderDTO } from "@/types/service-order";

import { serviceOrderSchema } from "@/schemas";

import { Form, FormButtons, Input, MultiSelect, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { useListAllEquipmentsQuery } from "@/redux/features/equipmentApiSlice";
import clsx from "clsx";

type ServiceOrderFields = z.infer<typeof serviceOrderSchema>;

type ServiceOrderFormFields = z.input<typeof serviceOrderSchema>;

type ServiceOrderFormProps = {
    serviceOrder: ServiceOrderDTO;
    unitId: number;
    disabled?: boolean;
    onCancel: () => void;
    onSubmit: (data: ServiceOrderFields) => Promise<void> | void;
    title?: string;
    containerClassName?: string;
    containerTestId?: string;
    canEditUpdates?: boolean;
    showUpdatesField?: boolean;
};

/**
 * ServiceOrderForm
 *
 * Renders a form to view or edit a Service Order.
 *
 * The form integrates react-hook-form with zod validation (serviceOrderSchema). When `disabled`
 * is true, inputs are rendered in read-only mode, action buttons are hidden, and equipments are
 * shown as badges with graceful handling when data is incomplete. Equipments are fetched via
 * `useListAllEquipmentsQuery`, filtered by `unitId`, and presented in a MultiSelect when editable.
 *
 * The form is always wrapped in an outer container. If `title` is provided, a header is rendered
 * above the form. Use `containerClassName` to override wrapper styles and `containerTestId` to
 * control the wrapper test id.
 *
 * @param props Component props
 * @param props.serviceOrder Initial data to populate the form and for read-only display
 * @param props.unitId Unit identifier used to filter available equipments in the selector
 * @param props.disabled If true, renders the form in read-only mode (default: false)
 * @param props.onCancel Callback executed when the user cancels the form
 * @param props.onSubmit Callback executed when the user submits the form
 * @param props.title Optional section title; when provided, a heading is rendered above the form
 * @param props.containerClassName Optional custom classes for the outer container
 * @param props.containerTestId Optional test id for the outer container (default: "service-order-details")
 *
 * @example
 * // Full section replacement (read-only)
 * <ServiceOrderForm
 *   serviceOrder={serviceOrder}
 *   unitId={unitId}
 *   disabled
 *   onSubmit={() => {}}
 *   title="Detalhes da Ordem de Serviço"
 * />
 *
 * @example
 * // Embedded usage with custom container styling
 * <ServiceOrderForm
 *   serviceOrder={serviceOrder}
 *   unitId={unitId}
 *   onCancel={() => console.log("Canceled")}
 *   onSubmit={save}
 *   title="Ordem de Serviço"
 *   containerClassName="m-6 sm:mx-auto w-full sm:max-w-3xl max-w-3xl"
 *   containerTestId="os-form-section"
 * />
 */
const ServiceOrderForm = ({
    serviceOrder,
    unitId,
    disabled = false,
    onCancel,
    onSubmit: onSubmitProp,
    title,
    containerClassName,
    containerTestId,
    canEditUpdates = false,
    showUpdatesField = true,
}: ServiceOrderFormProps) => {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ServiceOrderFormFields>({
        resolver: zodResolver(serviceOrderSchema),
        defaultValues: {
            subject: serviceOrder.subject,
            description: serviceOrder.description,
            conclusion: serviceOrder.conclusion,
            updates: serviceOrder.updates ?? "",
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

    const onSubmit: SubmitHandler<ServiceOrderFormFields> = async (data) => {
        await onSubmitProp(data as ServiceOrderFields);
        return;
    };

    const handleCancel = () => {
        onCancel?.();
    };

    const updatesInitial = (serviceOrder.updates ?? "").toString().trim();
    const shouldShowUpdates = showUpdatesField && (canEditUpdates || updatesInitial.length > 0);

    const formContent = (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 space-y-4">
                <Input
                    {...register("subject")}
                    type="text"
                    disabled={disabled}
                    placeholder="Assunto da ordem de serviço"
                    label="Assunto"
                    errorMessage={errors.subject?.message}
                    dataTestId="service-order-subject"
                ></Input>

                <Textarea
                    {...register("description")}
                    rows={6}
                    disabled={disabled}
                    placeholder="Descrição detalhada"
                    errorMessage={errors.description?.message}
                    label="Descrição"
                />

                <Textarea
                    {...register("conclusion")}
                    rows={6}
                    disabled={disabled}
                    placeholder="Conclusão do serviço"
                    errorMessage={errors.conclusion?.message}
                    label="Conclusão"
                />

                {shouldShowUpdates && (
                    <Textarea
                        {...register("updates")}
                        rows={6}
                        disabled={!canEditUpdates}
                        placeholder="Atualizações"
                        errorMessage={errors.updates?.message as string | undefined}
                        label="Atualizações"
                    />
                )}

                <div>
                    {disabled ? (
                        <>
                            <Typography element="p" size="sm" className="font-medium mb-1">
                                Equipamentos
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
                                                },
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
                                                        : "bg-danger/10 text-danger ring-danger/30",
                                                )}
                                            >
                                                {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Typography element="p" size="md" className="text-placeholder">
                                    Nenhum equipamento vinculado.
                                </Typography>
                            )}
                        </>
                    ) : (
                        <MultiSelect
                            label="Equipamentos"
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

            {(canEditUpdates || !disabled) && (
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

    const defaultContainerClasses = "m-6 sm:mx-auto w-full sm:max-w-3xl max-w-3xl";

    return (
        <div
            className={containerClassName ?? defaultContainerClasses}
            data-testid={containerTestId ?? "service-order-details"}
        >
            {title ? (
                <div className="flex items-center justify-between">
                    <Typography element="h3" size="title3" className="font-semibold">
                        {title}
                    </Typography>
                </div>
            ) : null}

            {formContent}
        </div>
    );
};

export default ServiceOrderForm;
