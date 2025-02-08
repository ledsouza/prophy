import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

const useNeedReview = () => {
    const { data: userData } = useRetrieveUserQuery();

    const needReview =
        userData?.role === "GGC" ||
        userData?.role === "FME" ||
        userData?.role === "GU";

    return { needReview };
};

export default useNeedReview;
