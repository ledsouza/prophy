import { forwardRef, InputHTMLAttributes } from "react";
import cn from "classnames";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    disabled?: boolean;
    errorMessage?: string;
    dataTestId?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            disabled = false,
            errorMessage,
            dataTestId,
            children,
            type,
            ...props
        }: InputProps,
        ref
    ) => {
        const inputClassName = cn(
            "block w-full rounded-md border-0 py-1.5 text-gray-primary shadow-md ring-1 ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6",
            {
                "ring-tertiary": disabled,
                "bg-danger bg-opacity-5 ring-danger": errorMessage,
                "ring-primary": !errorMessage && !disabled,
                "px-2 file:border-0 file:bg-secondary file:rounded-md file:text-white hover:file:cursor-pointer hover:file:bg-opacity-80 file:active:transform file:active:scale-95 file:transition-transform":
                    type === "file",
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
                    <input
                        ref={ref}
                        type={type}
                        disabled={disabled}
                        className={inputClassName}
                        data-testid={dataTestId}
                        {...props}
                    />
                </div>
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

Input.displayName = "Input";
export default Input;
