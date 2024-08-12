import { createContext, FC, ReactNode, useState } from "react";
import { jwtDecode } from "jwt-decode";

import api from "@/server/api";

import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants/jwt-token";

type JwtPayloadType = {
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    user_id: number;
};

export type AuthContextType = {
    isAuthenticated: boolean | null;
    setIsAuthenticated: (value: boolean) => void;
    auth: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
        null
    );

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
            console.log("Error refreshing token:", error);
            setIsAuthenticated(false);
        }
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthenticated(false);
            return;
        }
        const decodedToken = jwtDecode<JwtPayloadType>(token);
        const tokenExpiration = decodedToken.exp;
        const now = Date.now() / 1000; // Convert milliseconds to seconds

        if (tokenExpiration && tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthenticated(true);
        }
    };

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, setIsAuthenticated, auth }}
        >
            {children}
        </AuthContext.Provider>
    );
};
