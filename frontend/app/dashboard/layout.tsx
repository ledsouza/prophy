"use client";

import { Spinner } from "@/components/common";
import useRequireAuth from "@/hooks/use-require-auth";
import React from "react";

type DashboardLayoutProps = {
    children: React.ReactNode;
    clientManager: React.ReactNode;
    internalMedicalPhysicist: React.ReactNode;
    unitManager: React.ReactNode;
};

export default function DashboardLayout({
    children,
    clientManager,
    internalMedicalPhysicist,
    unitManager,
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

    if (userData?.role === "GU") {
        return <>{unitManager}</>;
    }

    return <>{children}</>;
}
