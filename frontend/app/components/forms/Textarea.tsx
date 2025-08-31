import {
    Textarea as HeadlessTextarea,
    TextareaProps as HeadlessTextareaProps,
} from "@headlessui/react";
import clsx from "clsx";
import { forwardRef, ReactNode } from "react";

type TextareaProps = Omit<HeadlessTextareaProps, "children"> & {
    errorMessage?: string;
    children?: ReactNode;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ errorMessage, children, disabled, ...props }: TextareaProps, ref) => {
        const inputClassName = clsx(
            "block w-full rounded-md border-0",
            "text-gray-primary shadow-md",
            "ring-1 ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-inset focus:ring-primary",
            "sm:text-sm sm:leading-6",
            {
                "py-1.5 ring-tertiary": disabled,
                "bg-danger bg-opacity-5 ring-danger": errorMessage,
                "py-1.5 ring-primary": !errorMessage && !disabled,
            }
        );

        return (
            <div>
                {children && (
                    <div className="flex justify-between align-center">
                        <label className="block text-sm font-medium leading-6 text-gray-primary">
                            {children}
                        </label>
                    </div>
                )}

                <div className="mt-2">
                    <HeadlessTextarea
                        ref={ref}
                        disabled={disabled}
                        className={inputClassName}
                        {...props}
                    />
                </div>

                {errorMessage && (
                    <div data-testid="validation-error" className="text-danger mt-1">
                        {errorMessage}
                    </div>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";
export default Textarea;
