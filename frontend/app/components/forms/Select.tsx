import React from "react";

import {
    Label,
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
    ListboxProps,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

import { Typography } from "@/components/foundation";

export type SelectData = {
    id: number;
    value: string;
};

type SelectProps = {
    options: SelectData[];
    selectedData: SelectData;
    setSelect: (value: SelectData) => void;
    label?: string;
    listBoxStyles?: string;
} & ListboxProps;

function Select({
    options,
    selectedData,
    setSelect,
    label = "",
    listBoxStyles = "",
}: SelectProps) {
    return (
        <Listbox value={selectedData} onChange={setSelect}>
            <Label>{label}</Label>
            <div className={`relative mt-2 ${listBoxStyles}`}>
                <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 mb-2 text-left shadow-sm ring-1 ring-inset ring-secondary focus:outline-none focus:ring-2 focus:primary sm:text-sm sm:leading-6">
                    <Typography
                        element="span"
                        size="lg"
                        className="ml-3 block truncate text-primary font-semibold"
                    >
                        {selectedData.value}
                    </Typography>
                    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                        <ChevronUpDownIcon
                            aria-hidden="true"
                            className="h-5 w-5 text-gray-400"
                        />
                    </span>
                </ListboxButton>

                <ListboxOptions
                    transition
                    className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
                >
                    {options.map((option) => (
                        <ListboxOption
                            key={option.id}
                            value={option}
                            className="group relative cursor-default select-none py-2 pl-3 pr-9 text-primary data-[focus]:bg-primary data-[focus]:text-white"
                        >
                            <div className="flex items-center">
                                <span className="ml-3 block truncate font-normal group-data-[selected]:font-semibold">
                                    {option.value}
                                </span>
                            </div>

                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                                <CheckIcon
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                />
                            </span>
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
        // <Field>
        //     <Label>{label}</Label>
        //     <HeadlessSelect
        //         name={label}
        //         aria-label={label}
        //         value={value}
        //         onChange={onChange}
        //         className={`rounded-md border-0 py-1.5 text-gray-primary shadow-md ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 ${className}`}
        //     >
        //         {options.map((option) => (
        //             <option key={option.id} value={option.value}>
        //                 {option.value}
        //             </option>
        //         ))}
        //     </HeadlessSelect>
        //     <ChevronDownIcon
        //         className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-primary"
        //         aria-hidden="true"
        //     />
        // </Field>
    );
}

export default Select;
