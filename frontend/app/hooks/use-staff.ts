import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import Role from "@/enums/Role";

const useStaff = () => {
    const { data: userData } = useRetrieveUserQuery();
    const isStaff = userData?.role === Role.FMI || userData?.role === Role.GP;

    return {
        isStaff,
        userData,
    };
};

export default useStaff;
