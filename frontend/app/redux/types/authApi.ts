import type { UserDTO } from "@/types/user";

export type UserAuth = {
    cpf: string;
    email: string;
    name: string;
    phone: string;
    password: string;
    re_password?: string;
};

export type RegisterUnitManagerResponse = {
    detail: string;
    email: string;
    userID: number;
};

export type RegisterUnitManagerRequest = Omit<UserAuth, "password" | "re_password"> & {
    unit_id: number;
};

export type ResetPasswordRequest = {
    uid: string;
    token: string;
    new_password: string;
    re_new_password: string;
};

export type ListManagedUsersQuery = {
    page?: number;
    cpf?: string;
    name?: string;
};

export type CreateManagedUserRequest = {
    cpf: string;
    email: string;
    name: string;
    phone: string;
    role: UserDTO["role"];
    is_active?: boolean;
};

export type UpdateManagedUserRequest = {
    id: number;
    cpf?: string;
    email?: string;
    name?: string;
    phone?: string;
    role?: UserDTO["role"];
    is_active?: boolean;
};
