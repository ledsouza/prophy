import { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/common";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ children, disabled, ...props }: ButtonProps) => {
    return (
        <div className="flex justify-center">
            <button
                {...props}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                {disabled ? <Spinner sm /> : children}
            </button>
        </div>
    );
};

export default Button;
