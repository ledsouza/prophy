import { IoArrowBack } from "react-icons/io5";
import { UnitDTO } from "@/redux/features/unitApiSlice";

import { formatPhoneNumber } from "@/utils/format";

import { ArrowFatLineLeft } from "@phosphor-icons/react";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";

type UnitDetailsProps = {
    selectedUnit: UnitDTO;
};

function UnitDetails({ selectedUnit }: UnitDetailsProps) {
    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            <Button href="/dashboard" variant="secondary">
                <div className="flex flex-row gap-2 justify-center align-middle text-center">
                    <ArrowFatLineLeft size="1.8em" />
                    <Typography size="md">Voltar</Typography>
                </div>
            </Button>

            <Typography
                element="h2"
                size="title2"
                className="font-bold"
                dataTestId="client-header"
            >
                Detalhes da Unidade
            </Typography>

            <Typography element="p" size="md" dataTestId="unit-details">
                <b>Nome:</b> {selectedUnit.name}
                <br />
                <b>CNPJ:</b> {selectedUnit.cnpj}
                <br />
                <b>Telefone:</b> {formatPhoneNumber(selectedUnit.phone)}
                <br />
                <b>E-mail:</b> {selectedUnit.email}
                <br />
                <b>Estado:</b> {selectedUnit.state}
                <br />
                <b>Cidade:</b> {selectedUnit.city}
                <br />
                <b>Endereço:</b> {selectedUnit.address}
            </Typography>
        </div>
    );
}

export default UnitDetails;
