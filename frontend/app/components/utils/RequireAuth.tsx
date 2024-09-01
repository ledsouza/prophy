"use client";

import { redirect } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { useEffect } from "react";
import { Spinner } from "@/components/common";

type Props = {
    children: React.ReactNode;
};

export default function RequireAuth({ children }: Props) {
    const { isLoading, isAuthenticated } = useAppSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            redirect("/auth/login");
        }
    }, [isLoading, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="flex justify-center my-8">
                <Spinner lg />
            </div>
        );
    }

    return <>{children}</>;
}
