import React, { useEffect, useState } from "react";
import cn from "classnames";

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
    operationsIDs?: Set<number>;
    rejectedOperationIDs?: Set<number>;
    listBoxStyles?: string;
    listOptionStyles?: string;
    dataTestId?: string | undefined;
} & ListboxProps;

function Select({
    options,
    selectedData,
    setSelect,
    label = "",
    operationsIDs,
    rejectedOperationIDs,
    listBoxStyles = "",
    listOptionStyles = "",
    dataTestId,
}: SelectProps) {
    const [hasOperation, setHasOperation] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    // const hasOperation: boolean =
    //     operationsIDs !== undefined && operationsIDs.size > 0;

    useEffect(() => {
        if (
            rejectedOperationIDs !== undefined &&
            rejectedOperationIDs.size > 0
        ) {
            setHasOperation(false);
            setIsRejected(true);
        } else if (operationsIDs !== undefined && operationsIDs.size > 0) {
            setHasOperation(true);
            setIsRejected(false);
        } else {
            setHasOperation(false);
            setIsRejected(false);
        }
    }, [operationsIDs, rejectedOperationIDs]);

    const listBoxButtonStyle = cn(
        "relative",
        "w-full rounded-md py-1.5 pl-3 pr-10 mb-2 sm:leading-6",
        "bg-white shadow-sm ring-1 ring-inset",
        "text-left sm:text-sm",
        "cursor-default",
        "focus:outline-none focus:ring-2 focus:primary",
        {
            "animate-warning": hasOperation,
            "animate-danger": isRejected,
        }
    );

    return (
        <div data-testid={dataTestId}>
            <Listbox value={selectedData} onChange={setSelect}>
                <Label>{label}</Label>
                <div className={`relative mt-2 ${listBoxStyles}`}>
                    <ListboxButton className={listBoxButtonStyle}>
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
                        {options.map((option) => {
                            const listBoxOptionStyle = cn(
                                "group relative",
                                "cursor-default select-none",
                                "py-2 pl-3 pr-9",
                                "text-primary",
                                "data-[focus]:bg-primary data-[focus]:text-white",
                                {
                                    "animate-warning": operationsIDs?.has(
                                        option.id
                                    ),
                                    "animate-danger": rejectedOperationIDs?.has(
                                        option.id
                                    ),
                                }
                            );

                            return (
                                <ListboxOption
                                    key={option.id}
                                    value={option}
                                    className={listBoxOptionStyle}
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
                            );
                        })}
                    </ListboxOptions>
                </div>
            </Listbox>
        </div>
    );
}

export default Select;
