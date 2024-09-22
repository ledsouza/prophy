import { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/common";
import cn from "classnames";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
    isLoading?: boolean;
};

const Button = ({
    children,
    disabled,
    variant = "primary",
    isLoading = false,
    className,
    ...props
}: ButtonProps) => {
    const computedClassName = cn(
        "flex justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
        {
            "bg-primary text-white hover:bg-secondary focus-visible:outline-primary":
                variant === "primary",
            "bg-quaternary text-gray-800 hover:bg-opacity-50 focus-visible:outline-quaternary":
                variant === "secondary",
            "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600":
                variant === "danger",
        }
    );

    return (
        <button
            {...props}
            className={computedClassName}
            disabled={disabled || isLoading}
        >
            {isLoading ? <Spinner sm /> : <div>{children}</div>}
        </button>
    );
};

export default Button;
