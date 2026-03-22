"use client";

import clsx from "clsx";
import { type ReactNode, useMemo, useState } from "react";

import { Button } from "@/components/common";
import { Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";

type ReviewDiffField = {
    id: string;
    label: string;
    currentValue: string;
    proposedValue: string;
    multiline?: boolean;
    currentPreview?: ReactNode;
    proposedPreview?: ReactNode;
};

type ReviewEditDiffProps = {
    title: string;
    subtitle: string;
    fields: ReviewDiffField[];
    rejectionNote: string;
    rejectionError?: string;
    isSubmitting?: boolean;
    acceptLabel?: string;
    rejectLabel?: string;
    rejectionTitle?: string;
    onAccept: () => void;
    onOpenPreview?: (fieldId: string) => void;
    onReject: (note: string) => void;
};

const normalizeValue = (value: string): string => value.trim();

const ReviewEditDiff = ({
    title,
    subtitle,
    fields,
    rejectionNote,
    rejectionError,
    isSubmitting = false,
    acceptLabel = "Aceitar",
    rejectLabel = "Rejeitar",
    rejectionTitle = "Por favor, justifique o motivo da rejeição",
    onAccept,
    onOpenPreview,
    onReject,
}: ReviewEditDiffProps) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [localRejectionNote, setLocalRejectionNote] = useState(rejectionNote);

    const comparableFields = useMemo(
        () =>
            fields.map((field) => {
                const currentValue = normalizeValue(field.currentValue);
                const proposedValue = normalizeValue(field.proposedValue);

                return {
                    ...field,
                    currentValue,
                    proposedValue,
                    changed:
                        currentValue.localeCompare(proposedValue, "pt-BR", {
                            sensitivity: "base",
                        }) !== 0,
                };
            }),
        [fields],
    );

    const changedFields = comparableFields.filter((field) => field.changed);
    const unchangedFields = comparableFields.filter((field) => !field.changed);

    if (isRejecting) {
        return (
            <div
                className="flex w-full max-w-3xl flex-col gap-6"
                data-cy="review-edit-diff-modal"
            >
                <Typography element="h3" size="title3" className="font-semibold">
                    {rejectionTitle}
                </Typography>

                <Textarea
                    rows={16}
                    value={localRejectionNote}
                    onChange={(event) => setLocalRejectionNote(event.target.value)}
                    errorMessage={rejectionError}
                    placeholder="Justifique o motivo da rejeição"
                    data-testid="rejection-note-input"
                    dataCy="review-rejection-note-input"
                />

                <div className="flex flex-col gap-2 py-2 sm:flex-row">
                    <Button
                        type="button"
                        onClick={() => setIsRejecting(false)}
                        variant="secondary"
                        className="w-full"
                        data-testid="back-btn"
                        dataCy="review-rejection-back-btn"
                    >
                        Voltar
                    </Button>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onReject(localRejectionNote)}
                        className="w-full"
                        data-testid="submit-rejection-btn"
                        dataCy="review-rejection-submit-btn"
                    >
                        Enviar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex w-full max-w-5xl flex-col gap-6"
            data-cy="review-edit-diff-modal"
        >
            <header className="space-y-1">
                <Typography element="h3" size="title3" className="font-semibold uppercase">
                    {title}
                </Typography>
                <Typography element="p" variant="secondary" size="md">
                    {subtitle}
                </Typography>
            </header>

            <div className="flex flex-col gap-4">
                {changedFields.map((field) => (
                    <section
                        key={field.id}
                        className="rounded-xl border border-success/25 bg-white p-4 shadow-md"
                        data-cy="review-diff-changed-field"
                    >
                        <div className="mb-3 flex items-start justify-between gap-4">
                            <Typography element="h4" size="md" className="font-semibold">
                                {field.label}
                            </Typography>
                            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-success">
                                Alterado
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div>
                                <Typography
                                    element="p"
                                    size="xs"
                                    variant="secondary"
                                    className="mb-2 uppercase tracking-wide"
                                >
                                    Valor atual
                                </Typography>

                                {field.currentPreview ? (
                                    <div className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                                        {field.currentPreview}
                                        {onOpenPreview && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="mt-3 w-full sm:w-auto"
                                                onClick={() => onOpenPreview(field.id)}
                                                dataCy="review-diff-preview-btn"
                                            >
                                                Ver imagem
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className={clsx(
                                            "rounded-lg border border-danger/20 bg-danger/5 p-3 text-danger",
                                            field.multiline ? "min-h-24 whitespace-pre-wrap" : "truncate",
                                        )}
                                    >
                                        <span className="mr-2 font-semibold">-</span>
                                        <span className="line-through">{field.currentValue || "—"}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Typography
                                    element="p"
                                    size="xs"
                                    variant="secondary"
                                    className="mb-2 uppercase tracking-wide"
                                >
                                    Novo valor
                                </Typography>

                                {field.proposedPreview ? (
                                    <div className="rounded-lg border border-success/25 bg-success/5 p-3">
                                        {field.proposedPreview}
                                        {onOpenPreview && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="mt-3 w-full sm:w-auto"
                                                onClick={() => onOpenPreview(field.id)}
                                                dataCy="review-diff-preview-btn"
                                            >
                                                Ver imagem
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className={clsx(
                                            "rounded-lg border border-success/25 bg-success/5 p-3 font-semibold text-success",
                                            field.multiline ? "min-h-24 whitespace-pre-wrap" : "truncate",
                                        )}
                                    >
                                        <span className="mr-2 text-xl leading-none">+</span>
                                        <span className="text-lg">{field.proposedValue || "—"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                ))}

                {unchangedFields.map((field) => (
                    <section
                        key={field.id}
                        className="rounded-xl border border-gray-200 bg-bg-surface p-4"
                        data-cy="review-diff-unchanged-field"
                    >
                        <div className="mb-2 flex items-start justify-between gap-4">
                            <Typography element="h4" size="md" className="font-medium">
                                {field.label}
                            </Typography>
                            <span className="text-sm font-semibold text-text-secondary">✓</span>
                        </div>

                        {field.proposedPreview ? (
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                                {field.proposedPreview}
                                {onOpenPreview && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="mt-3 w-full sm:w-auto"
                                        onClick={() => onOpenPreview(field.id)}
                                        dataCy="review-diff-preview-btn"
                                    >
                                        Ver imagem
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div
                                className={clsx(
                                    "rounded-lg border border-gray-200 bg-white p-3 text-text-secondary",
                                    field.multiline ? "min-h-20 whitespace-pre-wrap" : "truncate",
                                )}
                            >
                                {field.proposedValue || "—"}
                            </div>
                        )}
                    </section>
                ))}
            </div>

            <div className="flex flex-col gap-2 py-2 sm:flex-row">
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsRejecting(true)}
                    variant="danger"
                    className="w-full"
                    data-testid="reject-btn"
                    dataCy="review-reject-btn"
                >
                    {rejectLabel}
                </Button>
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onAccept}
                    className="w-full"
                    data-testid="submit-btn"
                    dataCy="review-accept-btn"
                >
                    {acceptLabel}
                </Button>
            </div>
        </div>
    );
};

export type { ReviewDiffField };
export default ReviewEditDiff;