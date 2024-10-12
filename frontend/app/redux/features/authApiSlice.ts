import { apiSlice } from "../services/apiSlice";

type UserAuth = {
    cpf: string;
    email: string;
    name: string;
    password: string;
    re_password?: string;
};

export type User = {
    id: number;
    cpf: string;
    email: string;
    name: string;
    role:
        | "Físico Médico Interno"
        | "Físico Médico Externo"
        | "Gerente Prophy"
        | "Gerente Geral do Cliente"
        | "Gerente de Unidade"
        | "Comercial";
};

const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<void, Omit<UserAuth, "email" | "name">>({
            query: ({ cpf, password }) => ({
                url: "jwt/create/",
                method: "POST",
                body: { cpf, password },
            }),
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "logout/",
                method: "POST",
            }),
        }),
        verify: builder.mutation<void, void>({
            query: () => ({
                url: "jwt/verify/",
                method: "POST",
            }),
        }),
        retrieveUser: builder.query<User, void>({
            query: () => "users/me/",
        }),
        getById: builder.query<User, User["id"]>({
            query: (id) => ({
                url: `users/${id}`,
                method: "GET",
            }),
        }),
        register: builder.mutation<any, UserAuth>({
            query: ({ cpf, email, name, password, re_password }) => ({
                url: "users/",
                method: "POST",
                body: { cpf, email, name, password, re_password },
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useVerifyMutation,
    useRetrieveUserQuery,
    useGetByIdQuery,
    useRegisterMutation,
} = authApiSlice;
