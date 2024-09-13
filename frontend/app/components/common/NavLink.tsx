import Link from "next/link";
import cn from "classnames";

type Props = {
    isSelected?: boolean;
    isMobile?: boolean;
    isBanner?: boolean;
    href?: string;
    className?: string;
    onClick?: () => void;
    children: React.ReactNode;
    "data-testid"?: string;
};

const NavLink = ({
    isSelected,
    isMobile,
    isBanner,
    href,
    className,
    onClick,
    children,
    "data-testid": dataTestId,
}: Props) => {
    const computedClassName = cn(
        className,
        "text-white rounded-md px-3 py-2 font-medium",
        {
            "bg-gray-900": isSelected,
            "text-gray-300 hover:bg-gray-700 hover:text-white":
                !isSelected && !isBanner,
            "block text-base": isMobile,
            "text-sm": !isMobile,
            "text-gray-300": isBanner,
        }
    );

    if (!href) {
        return (
            <span
                className={computedClassName}
                role="button"
                onClick={onClick}
                data-testid={dataTestId}
            >
                {children}
            </span>
        );
    }

    return (
        <Link
            className={computedClassName}
            href={href}
            data-testid={dataTestId}
        >
            {children}
        </Link>
    );
};

export default NavLink;
