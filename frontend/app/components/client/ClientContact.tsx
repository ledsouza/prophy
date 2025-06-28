import { ClientDTO } from "@/redux/features/clientApiSlice";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

import { getUserByRole } from "@/utils/api";
import { formatPhoneNumber } from "@/utils/format";
import { Typography } from "@/components/foundation";

type ClientContactProps = {
    client: ClientDTO;
};

function ClientContact({ client }: ClientContactProps) {
    const { data: userData } = useRetrieveUserQuery();

    const clientManager = getUserByRole(client, "GGC");
    const gerenteProphy = getUserByRole(client, "GP");
    const fisicoMedicoInterno = getUserByRole(client, "FMI");
    const fisicoMedicoExterno = getUserByRole(client, "FME");
    const comercial = getUserByRole(client, "C");

    if (
        userData?.role === "GGC" ||
        userData?.role === "GU" ||
        userData?.role === "FME" ||
        userData?.role === "GP"
    ) {
        return (
            <>
                <div>
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                        dataTestId="responsable-medical-physicist-header"
                    >
                        Físico Médico Responsável
                    </Typography>

                    {gerenteProphy || fisicoMedicoInterno || fisicoMedicoExterno ? (
                        <div className="flex flex-col gap-3">
                            {gerenteProphy && (
                                <div data-testid="gerente-prophy">
                                    <Typography element="p" size="md">
                                        {gerenteProphy.name}
                                        <br />
                                        {formatPhoneNumber(gerenteProphy.phone)}
                                        <br />
                                        {gerenteProphy.email}
                                    </Typography>
                                </div>
                            )}

                            {fisicoMedicoInterno && (
                                <div data-testid="fisico-medico-interno">
                                    <Typography element="p" size="md">
                                        {fisicoMedicoInterno.name}
                                        <br />
                                        {formatPhoneNumber(fisicoMedicoInterno.phone)}
                                        <br />
                                        {fisicoMedicoInterno.email}
                                    </Typography>
                                </div>
                            )}

                            {fisicoMedicoExterno && userData.role !== "FME" && (
                                <div data-testid="fisico-medico-externo">
                                    <Typography element="p" size="md">
                                        {fisicoMedicoExterno.name}
                                        <br />
                                        {formatPhoneNumber(fisicoMedicoExterno.phone)}
                                        <br />
                                        {fisicoMedicoExterno.email}
                                    </Typography>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Typography dataTestId="empty-responsable-medical-physicist">
                            Designaremos um físico médico para esta instituição e, em breve,
                            disponibilizaremos os dados de contato do profissional responsável.
                        </Typography>
                    )}
                </div>

                <div data-testid="comercial-details">
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                        dataTestId="comercial-header"
                    >
                        Gerente Comercial
                    </Typography>

                    {comercial || gerenteProphy ? (
                        <Typography>
                            {comercial?.name || gerenteProphy?.name}
                            <br />
                            {formatPhoneNumber(comercial?.phone) ||
                                formatPhoneNumber(gerenteProphy?.phone)}
                            <br />
                            {comercial?.email || gerenteProphy?.email}
                        </Typography>
                    ) : (
                        <Typography dataTestId="empty-comercial">
                            Designaremos um gerente comercial para esta instituição e, em breve,
                            disponibilizaremos os dados de contato do profissional responsável.
                        </Typography>
                    )}
                </div>
            </>
        );
    }

    if (userData?.role === "FMI") {
        return (
            <>
                <div>
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                        dataTestId="client-manager-contact-header"
                    >
                        Contato
                    </Typography>

                    {clientManager ? (
                        <div data-testid="client-manager">
                            <Typography element="p" size="md">
                                {clientManager.name}
                                <br />
                                {formatPhoneNumber(clientManager.phone)}
                                <br />
                                {clientManager.email}
                            </Typography>
                        </div>
                    ) : (
                        <Typography dataTestId="empty-client-manager">
                            Não há um contato associado a este cliente.
                        </Typography>
                    )}
                </div>

                <div data-testid="comercial-details">
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                        dataTestId="comercial-header"
                    >
                        Gerente Comercial
                    </Typography>

                    {comercial || gerenteProphy ? (
                        <Typography>
                            {comercial?.name || gerenteProphy?.name}
                            <br />
                            {formatPhoneNumber(comercial?.phone) ||
                                formatPhoneNumber(gerenteProphy?.phone)}
                            <br />
                            {comercial?.email || gerenteProphy?.email}
                        </Typography>
                    ) : (
                        <Typography dataTestId="empty-comercial">
                            Designaremos um gerente comercial para este cliente e, em breve,
                            disponibilizaremos os dados de contato do profissional responsável.
                        </Typography>
                    )}
                </div>
            </>
        );
    }
}

export default ClientContact;
