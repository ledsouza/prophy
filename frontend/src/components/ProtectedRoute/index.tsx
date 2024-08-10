import { ReactElement, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import api from "@/server/api";

import JwtPayload from "@/types/jwt-payload";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants/jwt-token";

type ProtectedRouteProps = {
    children: ReactElement;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
        null
    );

    useEffect(() => {
        auth().catch(() => setIsAuthenticated(false));
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
            setIsAuthenticated(false);
            return;
        }
        try {
            const response = await api.post("/autenticacao/token/refresh/", {
                refresh: refreshToken,
            });
            if (response.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.log(error);
            setIsAuthenticated(false);
        }
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthenticated(false);
            return;
        }
        const decodedToken = jwtDecode<JwtPayload>(token);
        const tokenExpiration = decodedToken.exp;
        const now = Date.now() / 1000; // Convert milliseconds to seconds

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthenticated(true);
        }
    };

    if (isAuthenticated === null) {
        return <div>Carregando...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
