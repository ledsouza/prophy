import Role from "@/enums/Role";

export type UserDTO = {
    id: number;
    cpf: string;
    email: string;
    phone: string;
    name: string;
    role: Role;
    is_active?: boolean;
    is_staff?: boolean;
};
