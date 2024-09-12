"use client";

import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Field,
    Label,
} from "@headlessui/react";
import { ReactNode, useState } from "react";

export type ComboboxDataProps = {
    id: number;
    name: string;
    sigla?: string;
};

type ComboBoxProps = {
    children: ReactNode;
    placeholder?: string;
    data: ComboboxDataProps[];
    selectedValue: ComboboxDataProps | null;
    onChange: (value: ComboboxDataProps) => void;
};

const ComboBox: React.FC<ComboBoxProps> = ({
    children,
    placeholder = "",
    data,
    selectedValue,
    onChange,
}) => {
    const [query, setQuery] = useState("");

    const filteredData =
        query === ""
            ? data
            : data.filter((value) => {
                  return value.name.toLowerCase().includes(query.toLowerCase());
              });

    return (
        <>
            <Field>
                <Label className="block mb-2 text-sm font-medium leading-6 text-gray-900">
                    {children}
                </Label>
                <Combobox
                    value={selectedValue}
                    virtual={{ options: filteredData }}
                    onChange={onChange}
                    onClose={() => setQuery("")}
                >
                    <ComboboxInput
                        aria-label="Assignee"
                        displayValue={(value: ComboboxDataProps) => value?.name}
                        placeholder={placeholder}
                        onChange={(event) => setQuery(event.target.value)}
                        className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                    <ComboboxOptions
                        anchor="bottom"
                        className="z-50 empty:invisible block w-1/4 rounded-md border-0 p-2 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                        {({ option: value }) => (
                            <ComboboxOption
                                key={value.id}
                                value={value}
                                className="data-[focus]:bg-blue-100"
                            >
                                {value.name}
                            </ComboboxOption>
                        )}
                    </ComboboxOptions>
                </Combobox>
            </Field>
        </>
    );
};

export default ComboBox;
