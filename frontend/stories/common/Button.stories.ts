import Button, { ButtonProps } from "@/components/common/Button";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<ButtonProps> = {
    title: "Common/Button",
    component: Button,
    argTypes: {
        children: {
            type: "string",
        },
        disabled: {
            type: "boolean",
        },
        variant: {
            options: ["primary", "secondary", "danger"],
            control: { type: "select" },
        },
        isLoading: {
            type: "boolean",
        },
        className: {
            type: "string",
        },
        href: {
            type: "string",
        },
    },
};

export default meta;

export const Primary: StoryObj<ButtonProps> = {
    args: {
        children: "Primary Button",
    },
};

export const Secondary: StoryObj<ButtonProps> = {
    args: {
        children: "Secondary Button",
        variant: "secondary",
    },
};

export const Danger: StoryObj<ButtonProps> = {
    args: {
        children: "Danger Button",
        variant: "danger",
    },
};

export const Disabled: StoryObj<ButtonProps> = {
    args: {
        children: "Disabled Button",
        disabled: true,
    },
};

export const Loading: StoryObj<ButtonProps> = {
    args: {
        children: "Loading Button",
        isLoading: true,
    },
};

export const LinkButton: StoryObj<ButtonProps> = {
    args: {
        children: "Link Button",
        href: "/example",
    },
};
