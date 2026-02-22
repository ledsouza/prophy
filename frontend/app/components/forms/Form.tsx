import clsx from "clsx";
import { FormEvent, ReactNode } from "react";

type Props = {
    children: ReactNode;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    className?: string;
};

export default function Form({ children, onSubmit, className }: Props) {
    return (
        <form className={clsx("space-y-6", className)} onSubmit={onSubmit}>
            {children}
        </form>
    );
}
