import { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/common";
import cn from "classnames";
import Link, { LinkProps } from "next/link";

type ButtonVariant = "primary" | "secondary" | "danger";

type CommonButtonProps = {
    children?: ReactNode;
    disabled?: boolean;
    variant?: ButtonVariant;
    isLoading?: boolean;
    className?: string;
};

type ButtonAsButton = ButtonHTMLAttributes<HTMLButtonElement> &
    CommonButtonProps & {
        href?: never;
    };

type ButtonAsLink = LinkProps &
    CommonButtonProps & {
        href: string;
    };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = ({
    children,
    disabled,
    variant = "primary",
    isLoading = false,
    href,
    className,
    ...props
}: ButtonProps) => {
    const computedClassName = cn(
        "flex justify-center align-middle rounded-md px-3 py-1.5 text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
        {
            "bg-primary text-white hover:bg-secondary focus-visible:outline-primary":
                variant === "primary",
            "bg-quaternary text-gray-primary hover:bg-opacity-50 focus-visible:outline-quaternary":
                variant === "secondary",
            "bg-danger text-white hover:bg-danger focus-visible:outline-danger":
                variant === "danger",
        }
    );

    const content = isLoading ? <Spinner md /> : <div>{children}</div>;

    if (href) {
        return (
            <Link
                {...(props as LinkProps)}
                className={computedClassName}
                href={href}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
            className={computedClassName}
            disabled={disabled || isLoading}
        >
            {content}
        </button>
    );
};

export default Button;
