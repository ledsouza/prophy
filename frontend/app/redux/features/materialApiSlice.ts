import { apiSlice, PaginatedResponse } from "../services/apiSlice";
import type {
    CreateMaterialArgs,
    ListMaterialsArgs,
    MaterialDTO,
    UpdateMaterialArgs,
} from "@/types/material";
import { toFormData, camelToSnake } from "@/utils/formData";

const materialApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listMaterials: builder.query<PaginatedResponse<MaterialDTO>, ListMaterialsArgs | void>({
            query: (args) => {
                const page = args?.page ?? 1;
                const params: Record<string, any> = { page };
                if (args?.visibility) params.visibility = args.visibility;
                if (args?.category) params.category = args.category;
                if (args?.search) params.search = args.search;
                return {
                    url: "materials/",
                    method: "GET",
                    params,
                };
            },
            providesTags: (result) =>
                result
                    ? [
                          ...result.results.map(({ id }) => ({
                              type: "Material" as const,
                              id,
                          })),
                          { type: "Material", id: "LIST" },
                      ]
                    : [{ type: "Material", id: "LIST" }],
        }),
        createMaterial: builder.mutation<MaterialDTO, CreateMaterialArgs>({
            query: ({
                title,
                description,
                visibility,
                category,
                file,
                allowed_external_user_ids,
            }) => {
                const formData = toFormData(
                    {
                        title,
                        description,
                        visibility,
                        category,
                        file,
                        allowed_external_user_ids,
                    },
                    {
                        keyMap: { allowed_external_user_ids: "allowed_external_users" },
                        transformKey: camelToSnake,
                        fileListMode: "first",
                    }
                );

                return {
                    url: "materials/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "Material", id: "LIST" }],
        }),
        deleteMaterial: builder.mutation<void, number>({
            query: (id) => ({
                url: `materials/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Material", id: "LIST" },
                { type: "Material", id },
            ],
        }),
        updateMaterial: builder.mutation<MaterialDTO, UpdateMaterialArgs>({
            query: ({ id, title, description, file }) => {
                const formData = toFormData(
                    { title, description, file },
                    { transformKey: camelToSnake, fileListMode: "first" }
                );
                return {
                    url: `materials/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Material", id },
                { type: "Material", id: "LIST" },
            ],
        }),
        downloadMaterialFile: builder.query<Blob, number>({
            query: (id) => ({
                url: `materials/${id}/download/`,
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
            keepUnusedDataFor: 0,
        }),
    }),
});

export const {
    useListMaterialsQuery,
    useCreateMaterialMutation,
    useDeleteMaterialMutation,
    useUpdateMaterialMutation,
    useLazyDownloadMaterialFileQuery,
} = materialApiSlice;

export default materialApiSlice;
