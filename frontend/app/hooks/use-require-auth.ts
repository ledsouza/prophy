import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            try {
                redirect("/auth/login");
            } finally {
                dispatch(clearApiCache());
            }
        }
    }, [isLoading, isAuthenticated, router]);

    return { isLoading, isAuthenticated, userData };
};

export default useRequireAuth;
