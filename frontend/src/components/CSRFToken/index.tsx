import { UserContext } from "@/contexts/UserContext";
import { api } from "@/server/api";
import Cookies from "js-cookie";
import { useContext, useEffect } from "react";

const CSRFToken = () => {
    const { csrftoken, setCSRFToken } = useContext(UserContext);

    useEffect(() => {
        const fetchCookie = async () => {
            try {
                await api.get("autenticacao/csrf_cookie");
                const token = Cookies.get("csrftoken");
                if (token) {
                    console.log(token);
                    setCSRFToken(token);
                } else {
                    throw new Error("CSRF token cookie is missing.");
                }
            } catch (error) {
                console.error("Failed to fetch CSRF cookie:", error);
            }
        };

        fetchCookie();
    }, [setCSRFToken]);

    return <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />;
};

export default CSRFToken;
