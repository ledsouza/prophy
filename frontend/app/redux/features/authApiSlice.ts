import { apiSlice } from "../services/apiSlice";

type UserAuth = {
    cpf: string;
    email: string;
    name: string;
    phone: string;
    password: string;
    re_password?: string;
};

export type UserDTO = {
    id: number;
    cpf: string;
    email: string;
    phone: string;
    name: string;
    role: "FMI" | "FME" | "GP" | "GGC" | "GU" | "C";
};

type RegisterUnitManagerResponse = {
    detail: string;
    email: string;
    userID: number;
};

type RegisterUnitManagerRequest = Omit<UserAuth, "password" | "re_password"> & {
    unit_id: number;
};

type ResetPasswordRequest = {
    uid: string;
    token: string;
    new_password: string;
    re_new_password: string;
};

const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<void, Omit<UserAuth, "email" | "name" | "phone">>({
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
        retrieveUser: builder.query<UserDTO, void>({
            query: () => "users/me/",
        }),
        getById: builder.query<UserDTO, UserDTO["id"]>({
            query: (id) => ({
                url: `users/${id}`,
                method: "GET",
            }),
        }),
        register: builder.mutation<any, UserAuth>({
            query: ({ cpf, email, phone, name, password, re_password }) => ({
                url: "users/",
                method: "POST",
                body: { cpf, email, phone, name, password, re_password },
            }),
        }),
        registerUnitManager: builder.mutation<
            RegisterUnitManagerResponse,
            RegisterUnitManagerRequest
        >({
            query: (requestBody) => ({
                url: "users/create-unit-manager/",
                method: "POST",
                body: requestBody,
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
        resetPassword: builder.mutation<void, ResetPasswordRequest>({
            query: (requestBody) => ({
                url: "/users/reset_password_confirm/",
                method: "POST",
                body: requestBody,
            }),
        }),
        deleterUser: builder.mutation<void, number>({
            query: (userID) => ({
                url: `/users/${userID}`,
                method: "DELETE",
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
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
    useRegisterUnitManagerMutation,
    useResetPasswordMutation,
    useDeleterUserMutation,
} = authApiSlice;
