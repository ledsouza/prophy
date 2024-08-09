import { api } from "@/server/api";
import axios from "axios";
import { createContext, ReactElement, useEffect, useState } from "react";

export const UserContext = createContext<{
    authorizedUser: boolean;
    setAuthorizedUser: React.Dispatch<React.SetStateAction<boolean>>;
}>({
    authorizedUser: false,
    setAuthorizedUser: () => {},
});

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
        <UserContext.Provider value={{ authorizedUser, setAuthorizedUser }}>
            {children}
        </UserContext.Provider>
    );
};
