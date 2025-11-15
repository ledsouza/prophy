"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";

type ConfirmDeleteProps<T> = {
    item: T;
    title?: string;
    message?: ReactNode;
    getItemLabel?: (item: T) => string;
    onConfirm: (item: T) => Promise<void> | void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmTestId?: string;
    cancelTestId?: string;
};

export default function ConfirmDelete<T>({
    item,
    title = "Excluir",
    message,
    getItemLabel,
    onConfirm,
    onCancel,
    confirmLabel = "Excluir",
    cancelLabel = "Cancelar",
    confirmTestId = "btn-confirm-delete",
    cancelTestId = "btn-cancel-delete",
}: ConfirmDeleteProps<T>) {
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        try {
            setSubmitting(true);
            await onConfirm(item);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <Typography element="h3" size="title3" className="font-semibold">
                {title}
            </Typography>
            {message ? (
                message
            ) : (
                <>
                    <Typography element="p" size="md" className="mt-2 text-gray-secondary">
                        Tem certeza que deseja excluir este item?
                    </Typography>
                    {getItemLabel && (
                        <Typography element="p" size="sm" className="mt-1 text-gray-secondary">
                            {getItemLabel(item)}
                        </Typography>
                    )}
                </>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                    data-testid={cancelTestId}
                >
                    {cancelLabel}
                </Button>
                <Button
                    type="button"
                    variant="danger"
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                    data-testid={confirmTestId}
                >
                    {submitting ? "Excluindo..." : confirmLabel}
                </Button>
            </div>
        </div>
    );
}
