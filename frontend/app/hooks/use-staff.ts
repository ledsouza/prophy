import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

const useStaff = () => {
    const { data: userData } = useRetrieveUserQuery();
    const isStaff = userData?.role === "FMI" || userData?.role === "GP";

    return {
        isStaff,
        userData,
    };
};

export default useStaff;
