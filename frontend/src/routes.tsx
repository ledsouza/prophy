import { BrowserRouter, Route, Routes } from "react-router-dom";
import Default from "./pages/Default";
import Login from "./pages/Login";
import { UserProvider } from "./contexts/UserContext";

function AppRoutes() {
    return (
        <BrowserRouter>
            <UserProvider>
                <Routes>
                    <Route path="/" element={<Default />}>
                        <Route path="login" element={<Login />} />
                    </Route>
                </Routes>
            </UserProvider>
        </BrowserRouter>
    );
}

export default AppRoutes;
