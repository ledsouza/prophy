import { Button } from "@/components/common";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Button> = {
    title: "Design System/Common/Button",
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

export const Primary: StoryObj<typeof Button> = {
    args: {
        children: "Primary Button",
    },
};

export const Secondary: StoryObj<typeof Button> = {
    args: {
        children: "Secondary Button",
        variant: "secondary",
    },
};

export const Danger: StoryObj<typeof Button> = {
    args: {
        children: "Danger Button",
        variant: "danger",
    },
};

export const Disabled: StoryObj<typeof Button> = {
    args: {
        children: "Disabled Button",
        disabled: true,
    },
};

export const Loading: StoryObj<typeof Button> = {
    args: {
        children: "Loading Button",
        isLoading: true,
    },
};

export const LinkButton: StoryObj<typeof Button> = {
    args: {
        children: "Link Button",
        href: "/example",
    },
};
