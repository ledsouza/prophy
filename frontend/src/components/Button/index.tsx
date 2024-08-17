import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ children, disabled, ...props }: ButtonProps) => {
    return (
        <button {...props} className="p-2 bg-blue-500 text-white">
            {disabled ? "Carregando..." : children}
        </button>
    );
};

export default Button;
