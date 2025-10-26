"use client";

import { Spinner } from "@/components/common";
import useRequireAuth from "@/hooks/use-require-auth";
import Role from "@/enums/Role";

type DashboardDefaultProps = {
    children: React.ReactNode;
    clientManager: React.ReactNode;
};

export default function DashboardDefault({ children, clientManager }: DashboardDefaultProps) {
    const { userData, isLoading } = useRequireAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center my-8">
                <Spinner fullscreen />
            </div>
        );
    }

    return <>{userData?.role === Role.GGC ? clientManager : children}</>;
}
