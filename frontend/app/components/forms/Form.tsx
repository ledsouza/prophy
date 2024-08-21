import { FormEvent, ReactNode } from "react";

type Props = {
    children: ReactNode;
    isLoading: boolean;
    btnText: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function Form({ children, onSubmit }: Props) {
    return (
        <form className="space-y-6" onSubmit={onSubmit}>
            {children}
        </form>
    );
}
