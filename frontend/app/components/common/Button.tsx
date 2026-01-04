import { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/common";
import cn from "classnames";
import Link, { LinkProps } from "next/link";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";

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
        dataTestId?: string;
        dataCy?: string;
    };

type ButtonAsLink = LinkProps &
    CommonButtonProps & {
        href: string;
        dataTestId?: string;
        dataCy?: string;
    };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = ({
    children,
    disabled,
    variant = "primary",
    isLoading = false,
    href,
    className,
    dataTestId,
    dataCy,
    ...props
}: ButtonProps) => {
    const computedClassName = cn(
        "flex justify-center align-middle items-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:transform active:scale-95 transition-transform",
        className,
        {
            "bg-primary text-white hover:bg-secondary focus-visible:outline-primary":
                variant === "primary",
            "bg-quaternary text-gray-primary hover:bg-opacity-50 focus-visible:outline-quaternary":
                variant === "secondary",
            "bg-danger text-white hover:bg-danger hover:bg-opacity-80 focus-visible:outline-danger":
                variant === "danger",
            "bg-success text-white hover:bg-success/90 focus-visible:outline-success":
                variant === "success",
            "bg-opacity-70 text-white hover:bg-opacity-80 focus-visible:outline-secondary":
                disabled,
        }
    );

    const content = isLoading ? <Spinner md /> : <>{children}</>;

    if (href) {
        return (
            <Link
                className={computedClassName}
                data-testid={dataTestId}
                data-cy={dataCy}
                {...(props as LinkProps)}
                href={href}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            className={computedClassName}
            disabled={disabled || isLoading}
            data-testid={dataTestId}
            data-cy={dataCy}
            {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
            {content}
        </button>
    );
};

export default Button;
