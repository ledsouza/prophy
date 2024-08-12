import { useContext } from "react";

import { AuthContext, AuthContextType } from "@/contexts/AuthContext";
import HeaderLink from "./HeaderLink";

function Header() {
    const { isAuthenticated } = useContext(AuthContext) as AuthContextType;

    return (
        <header className="p-4">
            <nav className="flex justify-center gap-4 text-2xl">
                <HeaderLink to={"./"} end>
                    Página Inicial
                </HeaderLink>
                {isAuthenticated ? (
                    <>
                        <HeaderLink to={"./logout"}>Logout</HeaderLink>
                        <HeaderLink to={"./profile"}>Perfil</HeaderLink>
                    </>
                ) : (
                    <HeaderLink to={"./login"}>Login</HeaderLink>
                )}
            </nav>
        </header>
    );
}

export default Header;
