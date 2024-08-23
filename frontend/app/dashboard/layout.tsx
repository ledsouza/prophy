import { RequireAuth } from "@/components/utils";

type Props = {
    children: React.ReactNode;
};

export default function Layout({ children }: Props) {
    return <RequireAuth>{children}</RequireAuth>;
}
