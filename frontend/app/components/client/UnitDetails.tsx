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

            <div>
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="unit-header"
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

            <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-bold"
                    dataTestId="unit-manager-header"
                >
                    Gerente de Unidade
                </Typography>

                {selectedUnit.user ? (
                    <Typography element="p" size="md">
                        {selectedUnit.user.name}
                        <br />
                        {formatPhoneNumber(selectedUnit.user.phone)}
                        <br />
                        {selectedUnit.user.email}
                    </Typography>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Typography element="p" size="md">
                            Nenhum gerente de unidade foi designado. Deseja
                            atribuir um agora?
                        </Typography>
                        <Button>Atribuir gerente de unidade</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UnitDetails;
