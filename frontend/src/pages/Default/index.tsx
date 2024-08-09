import Header from "@/components/Header";
import { Outlet } from "react-router-dom";

function Default() {
    return (
        <main>
            <Header />
            <Outlet />
        </main>
    );
}

export default Default;
