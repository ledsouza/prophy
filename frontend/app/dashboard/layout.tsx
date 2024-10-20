"use client";

import { Spinner } from "@/components/common";
import useRequireAuth from "@/hooks/use-require-auth";

type DashboardLayoutProps = {
    children: React.ReactNode;
    clientManager: React.ReactNode;
};

export default function DashboardLayout({
    children,
    clientManager,
}: DashboardLayoutProps) {
    const { userData, isLoading } = useRequireAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center my-8">
                <Spinner lg />
            </div>
        );
    }

    return (
        <>
            {userData?.role === "Gerente Geral do Cliente"
                ? clientManager
                : children}
        </>
    );
}
