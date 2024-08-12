import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type HeaderLinkProps = {
    children: ReactNode;
    to: string;
    end?: boolean;
};

const HeaderLink = ({ children, to, end = false }: HeaderLinkProps) => {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? "underline" : "")}
        >
            {children}
        </NavLink>
    );
};

export default HeaderLink;
