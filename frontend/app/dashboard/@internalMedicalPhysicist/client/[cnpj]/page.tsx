"use client";

import { useParams } from "next/navigation";

import MedicalPhysicistClientDetailPage from "@/components/dashboard/MedicalPhysicistClientDetailPage";
import Role from "@/enums/Role";

export default function InternalMedicalPhysicistClientDetailRoute() {
    const params = useParams();

    return (
        <MedicalPhysicistClientDetailPage
            cnpj={params.cnpj as string}
            role={Role.FMI}
        />
    );
}