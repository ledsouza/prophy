import { forwardRef, InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, ...props }: InputProps, ref) => {
        return (
            <div className="flex flex-col">
                {label && <label className="mb-1">{label}</label>}
                <input {...props} ref={ref} className="border p-2" />
                {error && <div className="text-red-500">{error}</div>}
            </div>
        );
    }
);

export default Input;
