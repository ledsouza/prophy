import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Default from "./pages/Default";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

import { BASE } from "./constants/routes";
import { AuthProvider } from "./contexts/AuthContext";

const Logout = () => {
    localStorage.clear();
    return <Navigate to={`${BASE}login`} />; // Need tests
};

function AppRoutes() {
    return (
        <BrowserRouter>
            <AuthProvider>
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
            </AuthProvider>
        </BrowserRouter>
    );
}

export default AppRoutes;
