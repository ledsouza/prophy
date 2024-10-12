import {
    apiSlice,
    ListQueryParams,
    PaginatedResponse,
} from "../services/apiSlice";
import { User } from "./authApiSlice";

export type Cliente = {
    id: number;
    cnpj: string;
    nome_instituicao: string;
    nome_contato: string;
    email_contato: string;
    email_instituicao: string;
    telefone_instituicao: string;
    endereco_instituicao: string;
    estado_instituicao: string;
    cidade_instituicao: string;
    status: string;
    users?: Pick<User, "name" | "role">[];
};

type PropostaStatus = {
    approved: boolean;
};

const clienteApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        verifyPropostaStatus: builder.mutation<PropostaStatus, Cliente["cnpj"]>(
            {
                query: (cnpj) => ({
                    url: "propostas/status/",
                    method: "POST",
                    body: { cnpj },
                }),
            }
        ),
        createClient: builder.mutation<void, Omit<Cliente, "status" | "id">>({
            query: (clienteData) => ({
                url: "clientes/",
                method: "POST",
                body: clienteData,
            }),
        }),
        getByCnpj: builder.query<
            PaginatedResponse<Cliente>,
            { cnpj: Cliente["cnpj"] } & ListQueryParams
        >({
            query: ({ cnpj, page = 1 }) => ({
                url: `clientes/`,
                method: "GET",
                params: { cnpj, page },
            }),
        }),
        listClients: builder.query<PaginatedResponse<Cliente>, ListQueryParams>(
            {
                query: ({ page = 1 }) => ({
                    url: "clientes/",
                    method: "GET",
                    params: { page },
                }),
            }
        ),
    }),
});

export const {
    useVerifyPropostaStatusMutation,
    useCreateClientMutation,
    useGetByCnpjQuery,
    useListClientsQuery,
} = clienteApiSlice;
