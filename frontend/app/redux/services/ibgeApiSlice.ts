import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type IBGEApiResponse = {
    id: number;
    nome: string;
    sigla?: string;
};

export const ibgeApiSlice = createApi({
    reducerPath: "ibgeApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "https://servicodados.ibge.gov.br/api/v1/localidades/",
    }),
    endpoints: (builder) => ({
        getEstados: builder.query<IBGEApiResponse[], void>({
            query: () => "estados",
        }),
        getMunicipiosByEstadosId: builder.query<IBGEApiResponse[], number>({
            query: (id) => `estados/${id}/municipios`,
        }),
    }),
});

export const { useGetEstadosQuery, useGetMunicipiosByEstadosIdQuery } =
    ibgeApiSlice;
