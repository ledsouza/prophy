import { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/components/common";
import { ButtonProps } from "@/components/common/Button";

const meta: Meta<ButtonProps> = {
    title: "Common/Button",
    tags: ["autodocs"],
    component: Button,
    argTypes: {
        children: {
            type: "string",
        },
        variant: {
            type: "string",
            control: "radio",
            options: ["primary", "secondary", "danger"],
        },
        isLoading: {
            type: "boolean",
        },
        className: {
            type: "string",
        },
    },
};

export default meta;

export const Primary: StoryObj<ButtonProps> = {
    args: {
        children: "Button",
    },
};
