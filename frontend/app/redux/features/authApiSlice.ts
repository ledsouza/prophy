import { apiSlice } from "../services/apiSlice";

type UserAuth = {
    username: string;
    password: string;
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
        verify: builder.mutation<void, void>({
            query: () => ({
                url: "jwt/verify/",
                method: "POST",
            }),
        }),
        retrieveUser: builder.query<User, void>({
            query: () => "users/me/",
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "logout/",
                method: "POST",
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useVerifyMutation,
    useRetrieveUserQuery,
    useLogoutMutation,
} = authApiSlice;
