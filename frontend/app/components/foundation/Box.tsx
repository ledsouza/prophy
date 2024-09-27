import { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

export type BoxProps = VariantProps<typeof boxStyles> &
    HTMLAttributes<HTMLDivElement> & {
        children: ReactNode;
    };

const boxStyles = cva("", {
    variants: {
        rounded: {
            true: "rounded-lg",
        },
        border: {
            true: "border border-tertiary shadow-md",
        },
        type: {
            primary: "bg-tertiary",
            secondary: "bg-quaternary",
            success: "bg-green-100 text-green-100",
            error: "bg-danger text-danger",
        },
    },
    defaultVariants: {
        type: "primary",
    },
});

const Box = ({
    rounded = false,
    border = false,
    type = "primary",
    children,
    className,
    ...props
}: BoxProps) => {
    return (
        <div
            className={boxStyles({ rounded, border, type, className })}
            {...props}
        >
            {children}
        </div>
    );
};

export default Box;
