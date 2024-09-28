"use client";

import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Field,
    Label,
} from "@headlessui/react";
import { ReactNode, useEffect, useRef, useState } from "react";

import { debounce } from "lodash";
import { DebouncedFunc } from "lodash";
import cn from "classnames";

export type ComboboxDataProps = {
    id: number;
    name: string;
    sigla?: string;
};

export type ComboBoxProps = {
    children: ReactNode;
    placeholder?: string;
    data: ComboboxDataProps[];
    selectedValue: ComboboxDataProps | null;
    onChange: (value: ComboboxDataProps) => void;
    disabled?: boolean;
    errorMessage?: string;
    "data-testid"?: string;
};

const ComboBox = ({
    children,
    placeholder = "",
    data,
    selectedValue,
    onChange,
    disabled = false,
    errorMessage,
    "data-testid": dataTestId,
}: ComboBoxProps) => {
    const [filteredOptions, setFilteredOptions] = useState(data);

    const debouncedFilterRef = useRef<DebouncedFunc<(query: string) => void>>();

    useEffect(() => {
        debouncedFilterRef.current = debounce((query: string) => {
            const filtered =
                query === ""
                    ? data
                    : data.filter((value) => {
                          return value.name
                              .toLowerCase()
                              .includes(query.toLowerCase());
                      });
            setFilteredOptions(filtered);
        }, 100);

        return () => {
            debouncedFilterRef.current?.cancel();
        };
    }, [data]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = event.target.value;
        debouncedFilterRef.current?.(newQuery);
    };

    const inputClassName = cn(
        "block w-full rounded-md border-0 text-text-primary shadow-md ring-1 ring-inset placeholder:text-text-placeholder focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6",
        {
            "ring-tertiary": disabled,
            "bg-danger bg-opacity-5 ring-danger": errorMessage,
            "ring-primary": !disabled && !errorMessage,
        }
    );

    return (
        <>
            <Field data-testid={dataTestId} disabled={disabled}>
                <Label className="block mb-2 text-sm font-medium leading-6 text-text-primary">
                    {children}
                </Label>
                <Combobox
                    value={selectedValue}
                    virtual={{ options: filteredOptions }}
                    onChange={onChange}
                    onClose={() => setFilteredOptions(data)}
                >
                    <ComboboxInput
                        aria-label="Assignee"
                        displayValue={(value: ComboboxDataProps) => value?.name}
                        placeholder={placeholder}
                        onChange={handleInputChange}
                        className={inputClassName}
                    />
                    {errorMessage && (
                        <div
                            data-testid="validation-error"
                            className="text-danger"
                        >
                            {errorMessage}
                        </div>
                    )}
                    <ComboboxOptions
                        anchor="bottom"
                        data-testid="combobox-options"
                        className="z-50 empty:invisible block w-60 rounded-md border-0 mt-2 p-2 bg-white text-text-primary shadow-lg ring-1 ring-inset ring-primary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    >
                        {({ option: value }) => (
                            <ComboboxOption
                                key={value.id}
                                value={value}
                                className="rounded-md p-1 data-[focus]:bg-quaternary"
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
