import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Default from "./pages/Default";
import Login from "./pages/Login";

const Logout = () => {
    localStorage.clear();
    return <Navigate to="/login" />;
};

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Default />}>
                    <Route path="login" element={<Login />} />
                    <Route path="logout" element={<Logout />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
