"use client";

import { Spinner } from "@/components/common";
import useRequireAuth from "@/hooks/use-require-auth";
import React from "react";
import Role from "@/enums/Role";

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

    if (userData?.role === Role.GGC) {
        return (
            <div data-cy="dashboard-root" data-cy-role="GGC">
                {clientManager}
            </div>
        );
    }

    if (userData?.role === Role.FMI) {
        return (
            <div data-cy="dashboard-root" data-cy-role="FMI">
                {internalMedicalPhysicist}
            </div>
        );
    }

    if (userData?.role === Role.GU) {
        return (
            <div data-cy="dashboard-root" data-cy-role="GU">
                {unitManager}
            </div>
        );
    }

    if (userData?.role === Role.FME) {
        return (
            <div data-cy="dashboard-root" data-cy-role="FME">
                {externalMedicalPhysicist}
            </div>
        );
    }

    if (userData?.role === Role.GP) {
        return (
            <div data-cy="dashboard-root" data-cy-role="GP">
                {prophyManager}
            </div>
        );
    }

    if (userData?.role === Role.C) {
        return (
            <div data-cy="dashboard-root" data-cy-role="C">
                {commercial}
            </div>
        );
    }

    return <div data-cy="dashboard-root">{children}</div>;
}
