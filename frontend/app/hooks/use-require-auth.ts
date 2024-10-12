import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const useRequireAuth = () => {
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: userData } = useRetrieveUserQuery();

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return { isLoading, isAuthenticated, userData };
};

export default useRequireAuth;
