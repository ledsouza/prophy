import { UserDTO } from "@/redux/features/authApiSlice";
import { ClientDTO } from "@/redux/features/clientApiSlice";

type UserRole = UserDTO["role"];

export const getUserByRole = (client: ClientDTO, role: UserRole) => {
    return client.users?.find((user) => user.role == role);
};
