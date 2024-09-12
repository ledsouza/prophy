import { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/common";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
    isLoading?: boolean;
};

const Button = ({
    children,
    disabled,
    variant = "primary",
    isLoading = false,
    ...props
}: ButtonProps) => {
    const getButtonClasses = (): string => {
        const baseClasses =
            "flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ";

        switch (variant) {
            case "primary":
                return `${baseClasses} bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600`;
            case "secondary":
                return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:outline-gray-600`;
            case "danger":
                return `${baseClasses} bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600`;
            default:
                return baseClasses;
        }
    };

    return (
        <div className="flex justify-center">
            <button
                {...props}
                className={getButtonClasses()}
                disabled={disabled || isLoading}
            >
                {isLoading ? (
                    <Spinner sm />
                ) : (
                    <span className="flex items-center gap-2">{children}</span>
                )}
            </button>
        </div>
    );
};

export default Button;
