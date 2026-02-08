import type { UserDTO } from "@/types/user";
import { apiSlice } from "../services/apiSlice";
import { PaginatedResponse } from "../services/apiTypes";
import type {
    CreateManagedUserRequest,
    ListManagedUsersQuery,
    RegisterUnitManagerRequest,
    RegisterUnitManagerResponse,
    ResetPasswordRequest,
    UpdateManagedUserRequest,
    UserAuth,
} from "../types/authApi";

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
        getByCPF: builder.query<PaginatedResponse<UserDTO>, string>({
            query: (cpf) => ({
                url: `users/?cpf=${cpf}`,
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

        listManagedUsers: builder.query<PaginatedResponse<UserDTO>, ListManagedUsersQuery>({
            query: ({ page, cpf, name }) => {
                const params = new URLSearchParams();
                if (page) params.set("page", String(page));
                if (cpf) params.set("cpf", cpf);
                if (name) params.set("name", name);

                const queryString = params.toString();
                return `users/manage/${queryString ? `?${queryString}` : ""}`;
            },
            providesTags: [{ type: "User", id: "LIST" }],
        }),

        createManagedUser: builder.mutation<UserDTO, CreateManagedUserRequest>({
            query: (requestBody) => ({
                url: "users/manage/",
                method: "POST",
                body: requestBody,
            }),
            invalidatesTags: [{ type: "User", id: "LIST" }],
        }),

        updateManagedUser: builder.mutation<UserDTO, UpdateManagedUserRequest>({
            query: ({ id, ...requestBody }) => ({
                url: `users/manage/${id}/`,
                method: "PATCH",
                body: requestBody,
            }),
            invalidatesTags: [{ type: "User", id: "LIST" }],
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useVerifyMutation,
    useRetrieveUserQuery,
    useGetByIdQuery,
    useGetByCPFQuery,
    useLazyGetByCPFQuery,
    useRegisterMutation,
    useRegisterUnitManagerMutation,
    useResetPasswordMutation,
    useDeleterUserMutation,
    useListManagedUsersQuery,
    useCreateManagedUserMutation,
    useUpdateManagedUserMutation,
} = authApiSlice;
