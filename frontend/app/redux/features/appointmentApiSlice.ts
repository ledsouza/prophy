import { apiSlice } from "../services/apiSlice";
import type { PaginatedResponse } from "../services/apiSlice";
import { createPaginatedQueryFn } from "../services/paginationHelpers";
import type {
    AppointmentDTO,
    CreateAppointmentPayload,
    UpdateAppointmentPayload,
    ListAppointmentsArgs,
} from "@/types/appointment";

const appointmentApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * Lists appointments.
         * - If args.page is provided: returns just that page (optionally filtered by unit).
         * - If args.page is not provided: auto-paginates and returns all appointments across all pages (optionally filtered by unit).
         */
        listAppointments: builder.query<AppointmentDTO[], ListAppointmentsArgs | void>({
            queryFn: createPaginatedQueryFn<AppointmentDTO, ListAppointmentsArgs>("appointments/"),
            providesTags: [{ type: "Appointment", id: "LIST" }],
        }),
        /**
         * Lists a single paginated page of appointments, preserving count/next/previous.
         * Intended for UI tables that need total counts for pagination controls.
         */
        listAppointmentsPage: builder.query<
            PaginatedResponse<AppointmentDTO>,
            ListAppointmentsArgs | void
        >({
            query: (args) => ({
                url: "appointments/",
                method: "GET",
                params: (args ?? {}) as Record<string, unknown>,
            }),
            providesTags: [{ type: "Appointment", id: "LIST" }],
        }),
        createAppointment: builder.mutation<AppointmentDTO, CreateAppointmentPayload>({
            query: (data) => ({
                url: "appointments/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: [
                { type: "Appointment", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        updateAppointment: builder.mutation<
            AppointmentDTO,
            { id: number; data: UpdateAppointmentPayload }
        >({
            query: ({ id, data }) => ({
                url: `appointments/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: [
                { type: "Appointment", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        deleteAppointment: builder.mutation<{ success: boolean; id: number }, number>({
            query: (id) => ({
                url: `appointments/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [
                { type: "Appointment", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useListAppointmentsQuery,
    useListAppointmentsPageQuery,
    useCreateAppointmentMutation,
    useUpdateAppointmentMutation,
    useDeleteAppointmentMutation,
} = appointmentApiSlice;
export default appointmentApiSlice;
