"use client";

import OneSignal from "react-onesignal";
import { Spinner } from "@/components/common";
import useRequireAuth from "@/hooks/use-require-auth";
import { useEffect, useRef } from "react";

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

    const oneSignalInitialized = useRef(false);

    useEffect(() => {
        if (!oneSignalInitialized.current && typeof window !== "undefined") {
            OneSignal.init({ appId: "b939cd35-7885-4eed-aed8-4b3168258161" });
            oneSignalInitialized.current = true;
        }
    }, []);

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
