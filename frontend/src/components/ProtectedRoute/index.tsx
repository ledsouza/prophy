import { ReactElement, useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";

import { BASE } from "@/constants/routes";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
    children: ReactElement;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, setIsAuthenticated, auth } = useContext(
        AuthContext
    ) as AuthContextType;

    useEffect(() => {
        auth().catch(() => setIsAuthenticated(false));
    }, []);

    if (isAuthenticated === null) {
        return <div>Carregando...</div>;
    }

    return isAuthenticated ? children : <Navigate to={`${BASE}login`} />;
};

export default ProtectedRoute;
