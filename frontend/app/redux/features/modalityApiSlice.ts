import { apiSlice } from "../services/apiSlice";

export enum AccessoryType {
    DETECTOR = "D",
    COIL = "C",
    TRANSDUCER = "T",
    NONE = "N",
}

export type ModalityDTO = {
    id: number;
    name: string;
    accessory_type: AccessoryType;
};

const modalityApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listModalities: builder.query<ModalityDTO[], void>({
            query: () => ({
                url: "modalities/",
                method: "GET",
            }),
            providesTags: [{ type: "Modality", id: "LIST" }],
        }),
    }),
});

export const { useListModalitiesQuery } = modalityApiSlice;
