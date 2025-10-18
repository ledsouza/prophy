"use client";

import { Spinner } from "@/components/common";
import useRequireAuth from "@/hooks/use-require-auth";
import React from "react";

type DashboardLayoutProps = {
    children: React.ReactNode;
    clientManager: React.ReactNode;
    internalMedicalPhysicist: React.ReactNode;
    externalMedicalPhysicist: React.ReactNode;
    unitManager: React.ReactNode;
    prophyManager: React.ReactNode;
    commercial: React.ReactNode;
};

export default function DashboardLayout({
    children,
    clientManager,
    internalMedicalPhysicist,
    externalMedicalPhysicist,
    unitManager,
    prophyManager,
    commercial,
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

    if (userData?.role === "FME") {
        return <>{externalMedicalPhysicist}</>;
    }

    if (userData?.role === "GP") {
        return <>{prophyManager}</>;
    }

    if (userData?.role === "C") {
        return <>{commercial}</>;
    }

    return <>{children}</>;
}
