import Link from "next/link";
import cn from "classnames";

type Props = {
    isSelected?: boolean;
    isMobile?: boolean;
    isBanner?: boolean;
    variant?: "dark" | "light";
    href?: string;
    className?: string;
    onClick?: () => void;
    children: React.ReactNode;
    dataTestId?: string;
    dataCy?: string;
};

const NavLink = ({
    isSelected,
    isMobile,
    isBanner,
    variant = "dark",
    href,
    className,
    onClick,
    children,
    dataTestId,
    dataCy,
}: Props) => {
    const isLight = variant === "light";

    const computedClassName = cn("rounded-md px-3 py-2 font-medium", className, {
        "text-white bg-secondary": !isLight && isSelected,
        "text-white hover:bg-secondary": !isLight && !isSelected && !isBanner,
        "text-primary bg-quaternary": isLight && isSelected,
        "text-primary hover:bg-quaternary/70": isLight && !isSelected && !isBanner,
        "block text-base": isMobile,
        "text-sm": !isMobile,
        "text-quaternary": isBanner,
    });

    if (!href) {
        return (
            <span
                className={computedClassName}
                role="button"
                onClick={onClick}
                data-testid={dataTestId}
                data-cy={dataCy}
            >
                {children}
            </span>
        );
    }

    return (
        <Link className={computedClassName} href={href} data-testid={dataTestId} data-cy={dataCy}>
            {children}
        </Link>
    );
};

export default NavLink;
