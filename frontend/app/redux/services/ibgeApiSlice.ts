import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type Estado = {
    id: number;
    nome: string;
    sigla: string;
    regiao: {
        id: number;
        nome: string;
        sigla: string;
    };
};

export const ibgeApi = createApi({
    reducerPath: "ibgeApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "https://servicodados.ibge.gov.br/api/v1/localidades/",
    }),
    endpoints: (builder) => ({
        getEstados: builder.query<Estado[], void>({
            query: () => "estados",
        }),
    }),
});

export const { useGetEstadosQuery } = ibgeApi;
