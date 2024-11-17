import { UnitDTO } from "@/redux/features/unitApiSlice";

import { formatPhoneNumber } from "@/utils/format";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { ArrowFatLineLeft } from "@phosphor-icons/react";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";

type UnitDetailsProps = {
    selectedUnit: UnitDTO;
};

function UnitDetails({ selectedUnit }: UnitDetailsProps) {
    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            <Button
                href="/dashboard"
                variant="secondary"
                dataTestId="btn-go-back"
            >
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
                    <b>CNPJ:</b> {cnpjMask(selectedUnit.cnpj)}
                    <br />
                    <b>Telefone:</b> {formatPhoneNumber(selectedUnit.phone)}
                    <br />
                    <b>E-mail:</b> {selectedUnit.email}
                    <br />
                    <b>Endereço:</b> {selectedUnit.address}
                </Typography>

                <div className="flex flex-row gap-2 w-full mt-2">
                    <Button
                        variant="secondary"
                        className="flex-grow"
                        data-testid="btn-edit-unit"
                    >
                        Editar
                    </Button>
                    <Button
                        variant="danger"
                        className="flex-grow"
                        data-testid="btn-delete-unit"
                    >
                        Deletar
                    </Button>
                </div>
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
                    <Typography
                        element="p"
                        size="md"
                        dataTestId="unit-manager-user"
                    >
                        {selectedUnit.user.name}
                        <br />
                        {formatPhoneNumber(selectedUnit.user.phone)}
                        <br />
                        {selectedUnit.user.email}
                    </Typography>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Typography
                            element="p"
                            size="md"
                            dataTestId="empty-unit-manager-user"
                        >
                            Nenhum gerente de unidade foi designado. Deseja
                            atribuir um agora?
                        </Typography>
                        <Button dataTestId="btn-add-unit-manager">
                            Atribuir gerente de unidade
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UnitDetails;
