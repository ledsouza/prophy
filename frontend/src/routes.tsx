import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Default from "./pages/Default";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import { BASE } from "./constants/routes";

const Logout = () => {
    localStorage.clear();
    return <Navigate to="/login" />; // Need tests
};

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={BASE} element={<Default />}>
                    <Route path="login" element={<Login />} />
                    <Route path="logout" element={<Logout />} />
                    <Route
                        path="profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
