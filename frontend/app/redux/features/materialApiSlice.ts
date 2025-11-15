import { apiSlice, PaginatedResponse } from "../services/apiSlice";
import type { CreateMaterialArgs, ListMaterialsArgs, MaterialDTO } from "@/types/material";

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
                const formData = new FormData();
                formData.append("title", title);
                if (description) formData.append("description", description);
                formData.append("visibility", visibility);
                formData.append("category", category);
                formData.append("file", file);

                // Only send allowed_external_users when explicitly provided (INT + GP case)
                if (allowed_external_user_ids && allowed_external_user_ids.length > 0) {
                    // The backend serializer expects "allowed_external_users" as PK list
                    allowed_external_user_ids.forEach((id) =>
                        formData.append("allowed_external_users", String(id))
                    );
                }

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
    useLazyDownloadMaterialFileQuery,
} = materialApiSlice;

export default materialApiSlice;
