import cn from "classnames";
import { ImSpinner3 } from "@react-icons/all-files/im/ImSpinner3";

type Props = {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    fullscreen?: boolean;
};

export default function Spinner({ sm, md, lg, fullscreen }: Props) {
    const spinnerClassName = cn("animate-spin text-primary", {
        "w-4 h-4": sm,
        "w-6 h-6": md,
        "w-8 h-8": lg,
        "w-14 h-14": fullscreen,
    });

    return (
        <div
            role="status"
            className={fullscreen ? "flex justify-center items-center min-h-screen" : ""}
        >
            <ImSpinner3 className={spinnerClassName} />
            <span className="sr-only">Carregando...</span>
        </div>
    );
}
