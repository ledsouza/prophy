import { api } from "@/server/api";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

const CSRFToken = () => {
    const [csrftoken, setCSTFToken] = useState("");

    useEffect(() => {
        const fetchCookie = async () => {
            try {
                await api.get("autenticacao/csrf_cookie");
            } catch (error) {
                console.log(error);
            }
        };

        fetchCookie();
        setCSTFToken(Cookies.get("csrftoken") || "");
    }, []);

    return <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />;
};

export default CSRFToken;
