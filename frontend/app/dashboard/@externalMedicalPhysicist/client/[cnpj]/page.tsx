"use client";

import { useParams } from "next/navigation";

import MedicalPhysicistClientDetailPage from "@/components/dashboard/MedicalPhysicistClientDetailPage";
import Role from "@/enums/Role";

export default function ExternalMedicalPhysicistClientDetailRoute() {
    const params = useParams();

    return (
        <MedicalPhysicistClientDetailPage
            cnpj={params.cnpj as string}
            role={Role.FME}
        />
    );
}