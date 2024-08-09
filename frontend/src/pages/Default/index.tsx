import Header from "@/components/Header";
import axios from "axios";
import { Outlet } from "react-router-dom";

function Default() {
    axios.defaults.xsrfCookieName = "csrftoken";
    axios.defaults.xsrfHeaderName = "X-CSRFToken";
    axios.defaults.withCredentials = true;

    return (
        <main>
            <Header />
            <Outlet />
        </main>
    );
}

export default Default;
