import { Meta, StoryObj } from "@storybook/react";

import { Typography } from "@/components/foundation";
import { TypographyProps } from "@/components/foundation/Typography";

const meta: Meta<TypographyProps> = {
    title: "Foundation/Typography",
    tags: ["autodocs"],
    component: Typography,
    argTypes: {
        children: {
            type: "string",
        },
        variant: {
            type: "string",
            control: "radio",
            options: ["primary", "secondary", "tertiary", "danger"],
        },
        size: {
            type: "string",
            control: "select",
            options: ["xs", "sm", "md", "lg", "title1", "title2", "title3"],
        },
        element: {
            type: "string",
            control: "select",
            options: ["p", "h1", "h2", "h3", "h4"],
        },
        className: {
            type: "string",
        },
    },
};

export default meta;

export const Primary: StoryObj<TypographyProps> = {
    args: {
        children: "Hello World!",
    },
};
