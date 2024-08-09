import { api } from "@/server/api";
import { createContext, ReactElement, useEffect, useState } from "react";

export const UserContext = createContext(false);

type UserProviderProps = {
    children: ReactElement;
};

export const UserProvider = ({ children }: UserProviderProps) => {
    const [authorizedUser, setAuthorizedUser] = useState(false);

    const fetchUser = async () => {
        try {
            await api.get("/autenticacao/user");
            setAuthorizedUser(true);
        } catch (error) {
            console.log(error);
            setAuthorizedUser(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={authorizedUser}>
            {children}
        </UserContext.Provider>
    );
};
