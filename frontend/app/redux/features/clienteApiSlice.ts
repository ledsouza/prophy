import { apiSlice } from "../services/apiSlice";

export type Cliente = {
    cnpj: string;
    nome_instituicao: string;
    nome_contato: string;
    email_contato: string;
    email_instituicao: string;
    telefone_instituicao: string;
    endereco_instituicao: string;
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
                nome_instituicao,
                nome_contato,
                email_contato,
                email_instituicao,
                telefone_instituicao,
                endereco_instituicao,
            }) => ({
                url: "clientes/",
                method: "POST",
                body: {
                    cnpj,
                    nome_instituicao,
                    nome_contato,
                    email_contato,
                    email_instituicao,
                    telefone_instituicao,
                    endereco_instituicao,
                },
            }),
        }),
    }),
});

export const { useVerifyPropostaStatusMutation, useCreateMutation } =
    clienteApiSlice;
