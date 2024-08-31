import { apiSlice } from "../services/apiSlice";

export type Cliente = {
    cnpj: string;
    nomeInstituicao: string;
    nomeContato: string;
    emailContato: string;
    emailInstituicao: string;
    telefoneInstituicao: string;
    enderecoInstituicao: string;
    estadoInstituicao: string;
    cidadeInstituicao: string;
    status: string;
};

type PropostaStatus = {
    approved: boolean;
};

const clienteApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        verifyPropostaStatus: builder.mutation<
            PropostaStatus,
            Pick<Cliente, "cnpj">
        >({
            query: ({ cnpj }) => ({
                url: "potenciais-clientes/status/",
                method: "POST",
                body: { cnpj },
            }),
        }),
        create: builder.mutation<void, Cliente>({
            query: ({
                cnpj,
                nomeInstituicao,
                nomeContato,
                emailContato,
                emailInstituicao,
                telefoneInstituicao,
                enderecoInstituicao,
                estadoInstituicao,
                cidadeInstituicao,
            }) => ({
                url: "clientes/",
                method: "POST",
                body: {
                    cnpj,
                    nomeInstituicao,
                    nomeContato,
                    emailContato,
                    emailInstituicao,
                    telefoneInstituicao,
                    enderecoInstituicao,
                    estadoInstituicao,
                    cidadeInstituicao,
                },
            }),
        }),
    }),
});

export const { useVerifyPropostaStatusMutation, useCreateMutation } =
    clienteApiSlice;
