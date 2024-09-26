import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const textStyles = cva("leading-8", {
    variants: {
        variant: {
            primary: "text-gray-primary",
            secondary: "text-gray-secondary",
            tertiary: "text-gray-tertiary",
            danger: "text-danger",
        },
        size: {
            xs: "text-xs",
            sm: "text-sm",
            md: "text-md",
            lg: "text-lg",
            title1: "text-4xl sm:text-6xl",
            title2: "text-2xl",
            title3: "text-xl",
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
});

export type TypographyProps = VariantProps<typeof textStyles> & {
    children: ReactNode;
    element?: keyof JSX.IntrinsicElements;
    dataTestId?: string | undefined;
} & JSX.IntrinsicElements["p"];

const Typography = ({
    children,
    element = "p",
    className,
    dataTestId = undefined,
    ...props
}: TypographyProps) => {
    const Element = element as any;
    return (
        <Element
            className={`${textStyles(props)} ${className}`}
            data-testid={dataTestId}
            {...props}
        >
            {children}
        </Element>
    );
};

export default Typography;
