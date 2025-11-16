"use client";

import clsx from "clsx";
import { forwardRef, InputHTMLAttributes, useState, useId, type ChangeEvent } from "react";
import { Field, Label } from "@headlessui/react";
import { Typography } from "@/components/foundation";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    disabled?: boolean;
    errorMessage?: string;
    dataTestId?: string;
    label?: string;
    labelStyles?: string;
    labelSize?: "sm" | "md" | "lg";
    // Prevent passing children to native <input/>
    children?: never;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            disabled = false,
            errorMessage,
            dataTestId,
            label,
            labelStyles = "",
            labelSize = "sm",
            type,
            ...props
        }: InputProps,
        ref
    ) => {
        const [fileName, setFileName] = useState<string>("");
        const autoId = useId();
        const inputId = (props.id as string | undefined) ?? autoId;

        const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
            setFileName(e.target.files?.[0]?.name ?? "");
            props.onChange?.(e);
        };

        const fileWrapperClassName = clsx(
            "block w-full rounded-md border-0 h-10 bg-white px-3",
            "text-gray-primary shadow-md",
            "ring-1 ring-inset ring-primary focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary",
            "sm:text-sm sm:leading-6",
            {
                "ring-tertiary": disabled,
                "bg-danger bg-opacity-5 ring-danger": errorMessage,
            }
        );

        const inputClassName = clsx(
            "flex w-full rounded-md border-0 h-9 px-3 bg-white",
            "text-gray-primary shadow-md",
            "ring-1 ring-inset ring-primary placeholder:text-placeholder focus:ring-2 focus:ring-inset focus:ring-primary",
            "sm:text-sm sm:leading-6",
            {
                "ring-tertiary": disabled,
                "bg-danger bg-opacity-5 ring-danger": errorMessage,
            },
            type === "file" &&
                "ring-primary file:py-1.5 file:border-0 file:bg-secondary file:rounded-md file:text-white hover:file:cursor-pointer hover:file:bg-opacity-80"
        );

        return (
            <Field disabled={disabled} data-testid={dataTestId}>
                {label && (
                    <Typography element="p" size={labelSize}>
                        <Label className={labelStyles}>{label}</Label>
                    </Typography>
                )}
                <div className="mt-2">
                    {type === "file" ? (
                        <div className={fileWrapperClassName}>
                            <div className="flex h-full items-center gap-3">
                                <label
                                    htmlFor={inputId}
                                    className="rounded-md bg-secondary px-3 py-1.5 text-white text-sm shadow-sm hover:bg-secondary/80 cursor-pointer select-none"
                                    aria-disabled={disabled}
                                >
                                    Escolher arquivo
                                </label>
                                <span className="truncate text-gray-primary">
                                    {fileName || "Nenhum arquivo selecionado"}
                                </span>
                            </div>
                            <input
                                {...props}
                                id={inputId}
                                ref={ref}
                                type="file"
                                disabled={disabled}
                                className="sr-only"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <input
                            ref={ref}
                            type={type}
                            disabled={disabled}
                            className={inputClassName}
                            {...props}
                        />
                    )}
                </div>
                {errorMessage && (
                    <div data-testid="validation-error" className="text-danger mt-1">
                        {errorMessage}
                    </div>
                )}
            </Field>
        );
    }
);

Input.displayName = "Input";
export default Input;
