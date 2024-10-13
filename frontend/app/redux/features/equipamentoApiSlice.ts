import {
    apiSlice,
    ListQueryParams,
    PaginatedResponse,
} from "../services/apiSlice";

export type Equipamento = {
    id: number;
    modalidade: string;
    fabricante: string;
    modelo: string;
    numero_serie: string;
    registro_anvisa: string;
    foto_equipamento: string;
    foto_etiqueta: string;
    responsavel_manutencao: string;
    email_responsavel: string;
    telefone_responsavel: string;
    unidade: number;
};

const equipamentoApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listEquipments: builder.query<
            PaginatedResponse<Equipamento>,
            ListQueryParams
        >({
            query: ({ page = 1 }) => ({
                url: "equipamentos/",
                method: "GET",
                params: { page },
            }),
        }),
    }),
});

export const { useListEquipmentsQuery } = equipamentoApiSlice;
