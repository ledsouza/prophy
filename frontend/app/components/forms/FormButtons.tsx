import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { Button } from "@/components/common";

type FormButtonsProps = {
    isRejected?: boolean;
    setIsRejected?: (value: boolean) => void;
    disabled?: boolean;
    reviewMode?: boolean;
    isSubmitting?: boolean;
    needReview?: boolean;
    submitLabel?: string;
    onCancel?: () => void;
};

/**
 * Renders form action buttons depending on the current form context.
 *
 * Behavior:
 * - Rejection state: shows "Voltar" and "Enviar"
 * - Review mode: shows "Rejeitar" and "Aceitar"
 * - Default: shows "Cancelar" and a submit button
 *
 * Params:
 * - isRejected: toggles the rejection sub-flow.
 * - setIsRejected: setter used to leave/enter rejection sub-flow.
 * - disabled: hides buttons and preserves layout height.
 * - reviewMode: enables the review action pair.
 * - isSubmitting: disables buttons while a submit is in-flight.
 * - needReview: switches default submit label to "Requisitar".
 * - submitLabel: optional explicit label for the submit button (e.g., "Agendar").
 * - onCancel: custom cancel handler; defaults to closing the modal.
 */
const FormButtons = ({
    isRejected = false,
    setIsRejected,
    disabled = false,
    reviewMode = false,
    isSubmitting = false,
    needReview = false,
    submitLabel,
    onCancel,
}: FormButtonsProps) => {
    const dispatch = useAppDispatch();

    // Handle rejection state buttons
    if (isRejected) {
        return (
            <div className="flex gap-2 py-4">
                <Button
                    type="button"
                    onClick={() => setIsRejected && setIsRejected(false)}
                    variant="secondary"
                    className="w-full"
                    data-testid="back-btn"
                >
                    Voltar
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-rejection-btn"
                    className="w-full"
                >
                    Enviar
                </Button>
            </div>
        );
    }

    // Handle review mode buttons
    if (!disabled && reviewMode) {
        return (
            <div className="flex gap-2 py-4">
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsRejected && setIsRejected(true)}
                    variant="danger"
                    className="w-full"
                    data-testid="reject-btn"
                >
                    Rejeitar
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-btn"
                    className="w-full"
                >
                    Aceitar
                </Button>
            </div>
        );
    }

    // Handle disabled state
    if (disabled) {
        return <br />;
    }

    // Default buttons (if not in review mode)
    return (
        <div className="flex gap-2 py-4">
            <Button
                type="button"
                disabled={isSubmitting}
                onClick={onCancel || (() => dispatch(closeModal()))}
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
                {submitLabel ?? (needReview ? "Requisitar" : "Atualizar")}
            </Button>
        </div>
    );
};

export default FormButtons;
