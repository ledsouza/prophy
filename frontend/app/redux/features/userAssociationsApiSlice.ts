import { apiSlice } from "../services/apiSlice";
import type {
    AddUserToClientPayload,
    RemoveUserFromClientPayload,
    SetUnitManagerPayload,
    UserAssociationsResponse,
} from "../types/userAssociations";

const userAssociationsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserAssociations: builder.query<UserAssociationsResponse, number>({
            query: (userId) => ({
                url: `users/manage/${userId}/associations/`,
                method: "GET",
            }),
            providesTags: (_result, _error, userId) => [{ type: "UserAssociations", id: userId }],
        }),
        addUserToClient: builder.mutation<void, AddUserToClientPayload>({
            query: ({ clientId, userId }) => ({
                url: `clients/${clientId}/users/`,
                method: "POST",
                body: { user_id: userId },
            }),
            invalidatesTags: (_result, _error, { userId }) => [
                { type: "UserAssociations", id: userId },
            ],
        }),
        removeUserFromClient: builder.mutation<void, RemoveUserFromClientPayload>({
            query: ({ clientId, userId }) => ({
                url: `clients/${clientId}/users/${userId}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { userId }) => [
                { type: "UserAssociations", id: userId },
            ],
        }),
        setUnitManager: builder.mutation<void, SetUnitManagerPayload>({
            query: ({ unitId, userId }) => ({
                url: `units/${unitId}/unit-manager/`,
                method: "PUT",
                body: { user_id: userId },
            }),
            invalidatesTags: (_result, _error, { associationUserId }) => [
                { type: "UserAssociations", id: associationUserId },
            ],
        }),
    }),
});

export const {
    useGetUserAssociationsQuery,
    useAddUserToClientMutation,
    useRemoveUserFromClientMutation,
    useSetUnitManagerMutation,
} = userAssociationsApiSlice;
