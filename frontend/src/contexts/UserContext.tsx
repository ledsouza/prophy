import { createContext, ReactElement, useState } from "react";

export type UserContent = {
    authorizedUser: boolean;
    setAuthorizedUser: (valor: boolean) => void;
    csrftoken: string;
    setCSRFToken: (valor: string) => void;
};

export const UserContext = createContext<UserContent>({
    authorizedUser: false,
    setAuthorizedUser: () => {},
    csrftoken: "",
    setCSRFToken: () => {},
});

type UserProviderProps = {
    children: ReactElement;
};

export const UserProvider = ({ children }: UserProviderProps) => {
    const [authorizedUser, setAuthorizedUser] = useState(false);
    const [csrftoken, setCSRFToken] = useState("");

    return (
        <UserContext.Provider
            value={{
                authorizedUser,
                setAuthorizedUser,
                csrftoken,
                setCSRFToken,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};
