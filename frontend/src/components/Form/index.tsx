import { FormHTMLAttributes } from "react";

type FormProps = FormHTMLAttributes<HTMLFormElement>;

const Form = ({ children, onSubmit, ...props }: FormProps) => {
    return (
        <form
            {...props}
            onSubmit={onSubmit}
            className="flex flex-col justify-items-center gap-4 w-1/2 m-auto"
        >
            {children}
        </form>
    );
};

export default Form;
