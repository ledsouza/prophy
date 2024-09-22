import cn from "classnames";
import { ImSpinner3 } from "@react-icons/all-files/im/ImSpinner3";

type Props = {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
};

export default function Spinner({ sm, md, lg }: Props) {
    const spinnerClassName = cn("animate-spin text-white-300 fill-white-300", {
        "w-4 h-4": sm,
        "w-6 h-6": md,
        "w-8 h-8": lg,
    });

    return (
        <div role="status">
            <ImSpinner3 className={spinnerClassName} />
            <span className="sr-only">Carregando...</span>
        </div>
    );
}
