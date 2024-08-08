import { BrowserRouter, Route, Routes } from "react-router-dom";
import Default from "./pages/Default";
import Login from "./pages/Login";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Default />}>
                    <Route path="login" element={<Login />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
