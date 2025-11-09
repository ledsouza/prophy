import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import Role from "@/enums/Role";

const useNeedReview = () => {
    const { data: userData } = useRetrieveUserQuery();

    const needReview =
        userData?.role === Role.GGC || userData?.role === Role.FME || userData?.role === Role.GU;

    return { needReview };
};

export default useNeedReview;
