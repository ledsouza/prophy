import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import cn from "classnames";

export type ButtonLinkProps = LinkProps & {
    children: ReactNode;
    className?: string;
};

const ButtonLink = ({
    children,
    href,
    className,
    ...props
}: ButtonLinkProps) => {
    const computedClassName = cn(
        "rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
    );
    return (
        <Link href={href} className={computedClassName} {...props}>
            {children}
        </Link>
    );
};

export default ButtonLink;
