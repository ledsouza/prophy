import cn from "classnames";
import { ImSpinner3 } from "@react-icons/all-files/im/ImSpinner3";

type Props = {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    fullscreen?: boolean;
};

export default function Spinner({ sm, md, lg, fullscreen }: Props) {
    const spinnerClassName = cn("animate-spin text-white-300 fill-white-300", {
        "w-4 h-4": sm,
        "w-6 h-6": md,
        "w-8 h-8": lg,
        "w-14 h-screen": fullscreen,
    });

    return (
        <div role="status" className={fullscreen ? "flex justify-center" : ""}>
            <ImSpinner3 className={spinnerClassName} color="#1c388c" />
            <span className="sr-only">Carregando...</span>
        </div>
    );
}
