import { UserDTO } from "@/redux/features/authApiSlice";
import type { ClientDTO } from "@/types/client";

type UserRole = UserDTO["role"];

export const getUserByRole = (client: ClientDTO, role: UserRole) => {
    return client.users?.find((user) => user.role == role);
};
