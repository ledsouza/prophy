import Role from "@/enums/Role";

export type UserDTO = {
    id: number;
    cpf: string;
    email: string;
    phone: string;
    name: string;
    role: Role;
};
