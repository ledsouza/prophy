"use client";

import React, { useMemo } from "react";
import cn from "classnames";
import {
    Field,
    Label,
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { Typography } from "@/components/foundation";
import type { SelectData } from "./Select";

type MultiSelectProps = {
    options: SelectData[];
    value: number[]; // selected IDs
    onChange: (ids: number[]) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    listBoxStyles?: string;
    listBoxButtonStyles?: string;
    listBoxButtonSize?: "sm" | "md" | "lg";
    listOptionStyles?: string;
    listOptionSize?: "sm" | "md" | "lg";
    labelStyles?: string;
    labelSize?: "sm" | "md" | "lg";
    dataTestId?: string | undefined;
    dataCy?: string;
};

/**
 * MultiSelect component using Headless UI Listbox with `multiple`.
 * Expects `options` with shape { id, value }, and exposes selection as array of IDs.
 */
const MultiSelect = ({
    options,
    value,
    onChange,
    label = "",
    placeholder = "Selecione...",
    disabled = false,
    listBoxStyles = "",
    listBoxButtonStyles = "",
    listBoxButtonSize = "md",
    listOptionStyles = "",
    listOptionSize = "md",
    labelStyles = "",
    labelSize = "md",
    dataTestId,
    dataCy,
}: MultiSelectProps) => {
    // Map value (ids) to option objects
    const selectedOptions = useMemo(
        () => options.filter((o) => value.includes(o.id)),
        [options, value],
    );

    const handleChange = (selected: SelectData[]) => {
        const ids = selected.map((s) => s.id);
        onChange(ids);
    };

    const listBoxButtonStyle = cn(
        "relative",
        "w-full rounded-md py-1.5 pr-10 sm:leading-6",
        "bg-white shadow-md ring-1 ring-inset ring-primary",
        "text-left sm:text-sm",
        "focus:ring-2 focus:ring-inset focus:ring-primary",
        listBoxButtonStyles,
    );

    const buttonText =
        selectedOptions.length > 0 ? selectedOptions.map((o) => o.value).join(", ") : placeholder;

    return (
        <div data-testid={dataTestId} data-cy={dataCy}>
            <Field disabled={disabled}>
                <Typography element="p" size={labelSize}>
                    <Label className={labelStyles}>{label}</Label>
                </Typography>
                <div className={`relative mt-2 ${listBoxStyles}`}>
                    <Listbox
                        value={selectedOptions}
                        onChange={handleChange}
                        multiple
                        disabled={disabled}
                    >
                        <ListboxButton
                            className={listBoxButtonStyle}
                            data-cy={dataCy ? `${dataCy}-button` : undefined}
                        >
                            <Typography
                                element="span"
                                size={listBoxButtonSize}
                                className="ml-3 block truncate text-primary font-semibold"
                            >
                                {buttonText}
                            </Typography>
                            {!disabled && (
                                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                        aria-hidden="true"
                                        className="h-5 w-5 text-gray-400"
                                    />
                                </span>
                            )}
                        </ListboxButton>

                        <ListboxOptions
                            modal={false}
                            transition
                            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-closed:data-leave:opacity-0 data-leave:transition data-leave:duration-100 data-leave:ease-in sm:text-sm"
                        >
                            {options.map((option) => {
                                const listBoxOptionStyle = cn(
                                    "group relative",
                                    "cursor-default select-none",
                                    "py-2 pl-3 pr-9",
                                    "text-primary",
                                    "data-focus:bg-primary data-focus:text-white",
                                    listOptionStyles,
                                );

                                return (
                                    <ListboxOption
                                        key={option.id}
                                        value={option}
                                        className={listBoxOptionStyle}
                                        data-cy={
                                            dataCy ? `${dataCy}-option-${option.id}` : undefined
                                        }
                                    >
                                        {({ selected }) => (
                                            <>
                                                <div className="flex items-center">
                                                    <Typography
                                                        element="span"
                                                        size={listOptionSize}
                                                        className={cn("block truncate", "ml-3", {
                                                            "font-semibold": selected,
                                                        })}
                                                    >
                                                        {option.value}
                                                    </Typography>
                                                </div>
                                                {selected && (
                                                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary group-data-focus:text-white">
                                                        <CheckIcon
                                                            aria-hidden="true"
                                                            className="h-5 w-5"
                                                        />
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </ListboxOption>
                                );
                            })}
                        </ListboxOptions>
                    </Listbox>
                </div>
            </Field>
        </div>
    );
};

export default MultiSelect;
