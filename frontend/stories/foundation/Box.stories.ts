import { Meta, StoryObj } from "@storybook/react";

import { Box } from "@/components/foundation";
import { BoxProps } from "@/components/foundation/Box";

const meta: Meta<BoxProps> = {
    title: "Foundation/Box",
    component: Box,
    tags: ["autodocs"],
    argTypes: {
        children: {
            control: "text",
        },
        rounded: {
            control: "boolean",
        },
        border: {
            control: "boolean",
        },
        type: {
            control: "select",
            options: ["primary", "secondary", "success", "error"],
        },
        className: {
            control: "text",
        },
    },
};

export default meta;

type Story = StoryObj<typeof Box>;

export const Primary: Story = {
    args: {
        children: "This is a primary box",
        type: "primary",
    },
};

export const Secondary: Story = {
    args: {
        children: "This is a secondary box",
        type: "secondary",
    },
};

export const Rounded: Story = {
    args: {
        children: "This is a rounded box",
        rounded: true,
        type: "primary",
    },
};

export const WithBorder: Story = {
    args: {
        children: "This is a box with a border",
        border: true,
        type: "primary",
    },
};

export const RoundedWithBorder: Story = {
    args: {
        children: "This is a box with a border",
        rounded: true,
        border: true,
        type: "primary",
    },
};

export const Success: Story = {
    args: {
        children: "This is a success box",
        type: "success",
    },
};

export const Error: Story = {
    args: {
        children: "This is an error box",
        type: "error",
    },
};
