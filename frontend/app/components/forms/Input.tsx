import { forwardRef, InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
    errorMessage?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(
    ({ errorMessage, children, ...props }: Props, ref) => {
        return (
            <div>
                {children && (
                    <div className="flex justify-between align-center">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            {children}
                        </label>
                    </div>
                )}
                <div className="mt-2">
                    <input
                        {...props}
                        ref={ref}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                </div>
                {errorMessage && (
                    <div
                        data-testid="validation-error"
                        className="text-red-500"
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
