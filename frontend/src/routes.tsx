import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Default from "./pages/Default";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";

const Logout = () => {
    localStorage.clear();
    return <Navigate to="/login" />;
};

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/static" element={<Default />}>
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
