import { Outlet } from "react-router-dom";

import Header from "@/components/Header";
import { useContext, useEffect } from "react";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";

function Default() {
    const { auth, setIsAuthenticated } = useContext(
        AuthContext
    ) as AuthContextType;

    useEffect(() => {
        auth().catch(() => setIsAuthenticated(false));
    }, []);

    return (
        <main>
            <Header />
            <Outlet />
        </main>
    );
}

export default Default;
