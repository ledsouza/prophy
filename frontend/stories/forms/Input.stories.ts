import { Meta, StoryObj } from "@storybook/react";

import { Input } from "@/components/forms";
import { InputProps } from "@/components/forms/Input";

const meta: Meta<InputProps> = {
    title: "Design System/Forms/Input",
    tags: ["autodocs"],
    component: Input,
    argTypes: {
        children: {
            type: "string",
        },
        placeholder: {
            type: "string",
        },
        disabled: {
            type: "boolean",
        },
        errorMessage: {
            type: "string",
        },
    },
};

export default meta;

export const Primary: StoryObj<InputProps> = {
    args: {
        children: "Input",
    },
};
