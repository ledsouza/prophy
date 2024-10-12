import {
    apiSlice,
    ListQueryParams,
    PaginatedResponse,
} from "../services/apiSlice";

export type Unidade = {
    id: number;
    nome: string;
    cnpj: string;
    nome_contato: string;
    email: string;
    telefone: string;
    endereco: string;
    estado: string;
    cidade: string;
    user: number;
    cliente: number;
};

const unidadeApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listUnits: builder.query<PaginatedResponse<Unidade>, ListQueryParams>({
            query: ({ page = 1 }) => ({
                url: "unidades/",
                method: "GET",
                params: { page },
            }),
        }),
    }),
});

export const { useListUnitsQuery } = unidadeApiSlice;
