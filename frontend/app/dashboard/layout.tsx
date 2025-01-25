"use client";

import { Spinner } from "@/components/common";
import useRequireAuth from "@/hooks/use-require-auth";

type DashboardLayoutProps = {
    children: React.ReactNode;
    clientManager: React.ReactNode;
    internalMedicalPhysicist: React.ReactNode;
};

export default function DashboardLayout({
    children,
    clientManager,
    internalMedicalPhysicist,
}: DashboardLayoutProps) {
    const { userData, isLoading } = useRequireAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center my-8">
                <Spinner fullscreen />
            </div>
        );
    }

    if (userData?.role === "GGC") {
        return <>{clientManager}</>;
    }

    if (userData?.role === "FMI") {
        return <>{internalMedicalPhysicist}</>;
    }

    return <>{children}</>;
}
