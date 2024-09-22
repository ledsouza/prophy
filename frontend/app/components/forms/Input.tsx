import { forwardRef, InputHTMLAttributes } from "react";
import cn from "classnames";

type Props = InputHTMLAttributes<HTMLInputElement> & {
    disabled?: boolean;
    errorMessage?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(
    ({ disabled = false, errorMessage, children, ...props }: Props, ref) => {
        const inputClassName = cn(
            "block w-full rounded-md border-0 py-1.5 text-text-primary shadow-md ring-1 ring-inset ring-primary placeholder:text-text-placeholder focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6",
            {
                "ring-tertiary": disabled,
            }
        );

        return (
            <div>
                {children && (
                    <div className="flex justify-between align-center">
                        <label className="block text-sm font-medium leading-6 text-text-primary">
                            {children}
                        </label>
                    </div>
                )}
                <div className="mt-2">
                    <input
                        {...props}
                        ref={ref}
                        disabled={disabled}
                        className={inputClassName}
                    />
                </div>
                {errorMessage && (
                    <div
                        data-testid="validation-error"
                        className="text-red-700"
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
