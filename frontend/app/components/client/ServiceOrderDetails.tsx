"use client";

import { ServiceOrderForm } from "@/components/forms";
import { Typography } from "@/components/foundation";
import type { ServiceOrderDTO } from "@/redux/features/visitApiSlice";

/**
 * Props for the ServiceOrderDetails component.
 * Describes the data and behaviors passed to the component.
 */
type ServiceOrderDetailsProps = {
    /** Service order data to display or edit. */
    serviceOrder: ServiceOrderDTO;
    /** When false, renders the form in read-only (disabled) mode. */
    canEdit: boolean;
    /** Identifier of the unit associated with the service order. */
    unitId: number;
    /** Optional callback invoked when the user cancels the form. */
    onCancel?: () => void;
};

/**
 * Renders the Service Order details section and the ServiceOrderForm.
 *
 * Displays a localized heading and delegates display/editing to ServiceOrderForm.
 * The form is disabled when `canEdit` is false. If provided, `onCancel` is invoked
 * when the user cancels the form. Includes `data-testid="service-order-details"` for testing.
 *
 * @param props Component props.
 * @param props.serviceOrder Service order data to display or edit.
 * @param props.canEdit When false, renders the form in read-only mode.
 * @param props.unitId Identifier of the unit associated with the service order.
 * @param [props.onCancel] Optional callback executed when the form is canceled.
 * @returns Container wrapping the section heading and the ServiceOrderForm.
 *
 * @example
 * <ServiceOrderDetails
 *   serviceOrder={serviceOrder}
 *   canEdit
 *   unitId={42}
 *   onCancel={() => console.log('Canceled')}
 * />
 */
function ServiceOrderDetails({
    serviceOrder,
    canEdit,
    unitId,
    onCancel,
}: ServiceOrderDetailsProps) {
    const handleCancel = () => {
        onCancel?.();
    };

    return (
        <div
            className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md"
            data-testid="service-order-details"
        >
            <div className="flex items-center justify-between">
                <Typography element="h3" size="title3" className="font-semibold">
                    Detalhes da Ordem de Serviço
                </Typography>
            </div>

            <ServiceOrderForm
                serviceOrder={serviceOrder}
                unitId={unitId}
                disabled={!canEdit}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default ServiceOrderDetails;
