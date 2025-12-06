import { redirect } from "next/navigation";
import { useEffect } from "react";

import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearApiCache } from "@/redux/services/apiSlice";

const useRequireAuth = () => {
    const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
    const { data: userData } = useRetrieveUserQuery();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            dispatch(clearApiCache());
            redirect("/auth/login");
        }
    }, [isLoading, isAuthenticated, dispatch]);

    return { isLoading, isAuthenticated, userData };
};

export default useRequireAuth;
