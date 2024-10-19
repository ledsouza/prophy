import { useEffect } from "react";
import { redirect } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { clearApiCache } from "@/redux/services/apiSlice";

const useRequireAuth = () => {
    const { isLoading, isAuthenticated } = useAppSelector(
        (state) => state.auth
    );
    const { data: userData } = useRetrieveUserQuery();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            dispatch(clearApiCache());
            redirect("/auth/login");
        }
    }, [isLoading, isAuthenticated]);

    return { isLoading, isAuthenticated, userData };
};

export default useRequireAuth;
