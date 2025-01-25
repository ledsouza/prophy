import { forwardRef, ReactNode } from "react";
import {
    Textarea as HeadlessTextarea,
    TextareaProps as HeadlessTextareaProps,
} from "@headlessui/react";
import cn from "classnames";

type TextareaProps = HeadlessTextareaProps & {
    errorMessage?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ errorMessage, children, disabled, ...props }: TextareaProps, ref) => {
        const inputClassName = cn(
            "block w-full mt-1 rounded-md border-0 text-gray-primary shadow-md ring-1 ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6",
            {
                "py-1.5 ring-tertiary": disabled,
                "bg-danger bg-opacity-5 ring-danger": errorMessage,
            }
        );

        return (
            <div>
                {children && (
                    <div className="flex justify-between align-center">
                        <label className="block text-sm font-medium leading-6 text-gray-primary">
                            {children as ReactNode}
                        </label>
                    </div>
                )}

                <HeadlessTextarea
                    ref={ref}
                    className={inputClassName}
                    {...props}
                />

                {errorMessage && (
                    <div
                        data-testid="validation-error"
                        className="text-danger mt-1"
                    >
                        {errorMessage}
                    </div>
                )}
            </div>
        );
    }
);

export default Textarea;
