"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type ResourcePanelShellProps = {
    children: ReactNode;
    className?: string;
};

const ResourcePanelShell = ({ children, className }: ResourcePanelShellProps) => {
    return (
        <div
            className={clsx(
                "flex flex-col min-h-0 gap-6",
                "bg-bg-surface rounded-xl shadow-lg",
                "p-6 md:p-8",
                className,
            )}
        >
            {children}
        </div>
    );
};

export default ResourcePanelShell;
