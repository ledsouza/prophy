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
    onCancel?: () => void;
};

/**
 * A reusable component for rendering form buttons with different states
 * based on the form context (rejection, review mode, etc.)
 */
const FormButtons = ({
    isRejected = false,
    setIsRejected,
    disabled = false,
    reviewMode = false,
    isSubmitting = false,
    needReview = false,
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
                {needReview ? "Requisitar" : "Atualizar"}
            </Button>
        </div>
    );
};

export default FormButtons;
