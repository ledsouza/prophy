import { apiSlice } from "../services/apiSlice";

type UserAuth = {
    username: string;
    password: string;
    re_password?: string;
};

export type User = {
    email: string;
    id: number;
    username: string;
};

const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<void, UserAuth>({
            query: ({ username, password }) => ({
                url: "jwt/create/",
                method: "POST",
                body: { username, password },
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
        register: builder.mutation<any, UserAuth>({
            query: ({ username, password, re_password }) => ({
                url: "users/",
                method: "POST",
                body: { username, password, re_password },
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useVerifyMutation,
    useRetrieveUserQuery,
    useRegisterMutation,
} = authApiSlice;
