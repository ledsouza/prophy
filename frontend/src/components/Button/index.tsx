import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ children, disabled, ...props }: ButtonProps) => {
    return (
        <div className="flex justify-center">
            <button
                {...props}
                className="w-1/4 p-2 rounded-full bg-blue-500 text-white"
            >
                {disabled ? "Carregando..." : children}
            </button>
        </div>
    );
};

export default Button;
