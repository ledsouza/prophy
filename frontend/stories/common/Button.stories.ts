import { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/components/common";
import { ButtonProps } from "@/components/common/Button";

const meta: Meta<ButtonProps> = {
    title: "Common/Button",
    tags: ["autodocs"],
    component: Button,
    argTypes: {},
};

export default meta;

export const Primary: StoryObj<ButtonProps> = {
    args: {
        children: "Button",
        variant: "primary",
    },
};
