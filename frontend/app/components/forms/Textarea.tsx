import {
    Textarea as HeadlessTextarea,
    TextareaProps as HeadlessTextareaProps,
    Field,
    Label,
} from "@headlessui/react";
import clsx from "clsx";
import { forwardRef } from "react";
import { Typography } from "@/components/foundation";

export type TextareaProps = Omit<HeadlessTextareaProps, "children"> & {
    errorMessage?: string;
    dataTestId?: string;
    dataCy?: string;
    label?: string;
    labelStyles?: string;
    labelSize?: "sm" | "md" | "lg";
    children?: never;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            errorMessage,
            disabled,
            dataTestId,
            dataCy,
            label,
            labelStyles = "",
            labelSize = "sm",
            ...props
        }: TextareaProps,
        ref,
    ) => {
        const inputClassName = clsx(
            "block w-full rounded-md border-0 px-3",
            "text-gray-primary shadow-md",
            "ring-1 ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-inset focus:ring-primary",
            "sm:text-sm sm:leading-6",
            {
                "py-1.5 ring-tertiary": disabled,
                "bg-danger/5 ring-danger": errorMessage,
                "py-1.5 ring-primary": !errorMessage && !disabled,
            },
        );

        return (
            <Field disabled={disabled} data-testid={dataTestId}>
                {label && (
                    <Typography element="p" size={labelSize}>
                        <Label className={labelStyles}>{label}</Label>
                    </Typography>
                )}
                <div className="mt-2">
                    <HeadlessTextarea
                        ref={ref}
                        disabled={disabled}
                        className={inputClassName}
                        data-cy={dataCy}
                        {...props}
                    />
                </div>

                {errorMessage && (
                    <div data-testid="validation-error" className="text-danger mt-1">
                        {errorMessage}
                    </div>
                )}
            </Field>
        );
    },
);

Textarea.displayName = "Textarea";
export default Textarea;
