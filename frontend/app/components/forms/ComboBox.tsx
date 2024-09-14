"use client";

import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Field,
    Label,
} from "@headlessui/react";
import { debounce } from "lodash";
import { DebouncedFunc } from "lodash";
import { ReactNode, useEffect, useRef, useState } from "react";

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
    errorMessage?: string;
    "data-testid"?: string;
};

const ComboBox: React.FC<ComboBoxProps> = ({
    children,
    placeholder = "",
    data,
    selectedValue,
    onChange,
    errorMessage,
    "data-testid": dataTestId,
}) => {
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

    return (
        <>
            <Field data-testid={dataTestId}>
                <Label className="block mb-2 text-sm font-medium leading-6 text-gray-900">
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
                        className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                    {errorMessage && (
                        <div
                            data-testid="validation-error"
                            className="text-red-500"
                        >
                            {errorMessage}
                        </div>
                    )}
                    <ComboboxOptions
                        anchor="bottom"
                        data-testid="combobox-options"
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
