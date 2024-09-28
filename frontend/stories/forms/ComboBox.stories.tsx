import type { Meta, StoryObj } from "@storybook/react";

import { ComboBox } from "@/components/forms";
import { ComboboxDataProps, ComboBoxProps } from "@/components/forms/ComboBox";
import { useState } from "react";

const ComboBoxStory = (args: ComboBoxProps) => {
    const [selectedValue, setSelectedValue] =
        useState<ComboboxDataProps | null>(args.selectedValue);

    const handleChange = (value: ComboboxDataProps) => {
        setSelectedValue(value);
    };

    return (
        <>
            <ComboBox
                {...args}
                data={data}
                selectedValue={selectedValue}
                onChange={handleChange}
            >
                <span>Label for combobox</span>
            </ComboBox>
        </>
    );
};

const meta: Meta<typeof ComboBox> = {
    title: "Design System/Forms/ComboBox",
    component: ComboBox,
    decorators: [
        (Story) => (
            <div
                style={{
                    paddingBottom: "15em",
                    paddingTop: "3em",
                    marginLeft: "10em",
                    marginRight: "10em",
                }}
            >
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

const data: ComboboxDataProps[] = [
    { id: 1, name: "Option 1" },
    { id: 2, name: "Option 2" },
    { id: 3, name: "Option 3" },
    { id: 4, name: "Option 4" },
    { id: 5, name: "Option 5" },
];

export const Default: Story = {
    args: {
        data,
        selectedValue: null,
        placeholder: "Select an option",
    },
    render: (args: ComboBoxProps) => {
        return <ComboBoxStory {...args} />;
    },
};

export const WithSelectedValue: Story = {
    args: {
        data,
        selectedValue: data[1],
        placeholder: "Select an option",
    },
    render: (args: ComboBoxProps) => {
        return <ComboBoxStory {...args} />;
    },
};

export const Disabled: Story = {
    args: {
        data,
        selectedValue: null,
        disabled: true,
        placeholder: "Select an option",
    },
    render: (args: ComboBoxProps) => {
        return <ComboBoxStory {...args} />;
    },
};

export const WithError: Story = {
    args: {
        data,
        selectedValue: null,
        errorMessage: "This field is required",
        placeholder: "Select an option",
    },
    render: (args: ComboBoxProps) => {
        return <ComboBoxStory {...args} />;
    },
};
