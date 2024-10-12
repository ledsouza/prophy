import React from "react";

import { Typography } from "@/components/foundation";
import { Button, UnitCard } from "@/components/common";

function ClientPage() {
    return (
        <main className="flex gap-6">
            <div className="flex gap-6 flex-col w-2/5">
                <Typography element="h2" size="title2" className="font-bold">
                    Detalhes do Cliente
                </Typography>

                <div>
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                    >
                        Responsável Prophy
                    </Typography>
                    <Typography element="p" size="md">
                        Alexandre Ferret
                    </Typography>
                    <Typography element="p" size="md">
                        (51) 98580 - 0080
                    </Typography>
                    <Typography element="p" size="md">
                        contato@prophy.com
                    </Typography>
                </div>

                <div>
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                    >
                        Hospital de Clínicas de Porto Alegre
                    </Typography>
                    <Typography element="p" size="md">
                        (51) 98580 - 0080
                    </Typography>
                    <Typography element="p" size="md">
                        contato@hcpa.com
                    </Typography>
                    <Typography element="p" size="md">
                        Rua Ramiro Barcelos, 2350 Bloco A, Av. Protásio Alves,
                        211 - Bloco B e C - Santa Cecília, Porto Alegre - RS
                    </Typography>
                </div>

                <div>
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                    >
                        Cobrança
                    </Typography>
                    <Typography element="p" size="md">
                        Número NFe:{" "}
                        <Typography element="span" className="font-semibold">
                            Nº: 000027
                        </Typography>
                    </Typography>
                    <Typography element="p" size="md">
                        Emissão:{" "}
                        <Typography element="span" className="font-semibold">
                            26 de Junho de 2024
                        </Typography>
                    </Typography>
                    <Typography element="p" size="md">
                        Vencimento:{" "}
                        <Typography element="span" className="font-semibold">
                            26 de Julho de 2024
                        </Typography>
                    </Typography>
                    <Button variant="secondary" className="mt-2">
                        Acessar detalhes
                    </Button>
                </div>
            </div>

            <div className="w-full flex flex-col gap-6 bg-white rounded-xl shadow-lg p-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="mb-6 font-bold"
                >
                    Unidades
                </Typography>

                <div className="flex flex-col gap-6">
                    <UnitCard
                        title="Unidade de Cardiologia Avançada"
                        status="Aceito"
                        equipmentsCount={3}
                    />
                    <UnitCard
                        title="Centro de Oncologia Integral"
                        status="Aceito"
                        equipmentsCount={1}
                    />
                </div>

                <Button>Adicionar Unidade</Button>
            </div>
        </main>
    );
}

export default ClientPage;
