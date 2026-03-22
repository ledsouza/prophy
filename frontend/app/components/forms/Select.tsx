"use client";

import cn from "classnames";
import React, { useEffect, useState } from "react";

import Role from "@/enums/Role";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

import {
    Field,
    Label,
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

import { Typography } from "@/components/foundation";

type SelectAnchor = "top" | "top start" | "top end" | "bottom" | "bottom start" | "bottom end";

type SelectContentProps = {
    label: string;
    labelAddon: React.ReactNode;
    labelSize: "sm" | "md" | "lg";
    labelStyles: string;
    listBoxStyles: string;
    listBoxButtonStyle: string;
    listBoxButtonSize: "sm" | "md" | "lg";
    isPlaceholder: boolean;
    placeholder?: string;
    selectedData: SelectData | null;
    disabled: boolean;
    optionsDataCy?: string;
    options: SelectData[];
    operationsIDs?: Set<number>;
    rejectedOperationIDs?: Set<number>;
    isStaff: boolean;
    listOptionStyles: string;
    listOptionSize: "sm" | "md" | "lg";
    optionsAnchor?: SelectAnchor;
};

const SelectContent = ({
    label,
    labelAddon,
    labelSize,
    labelStyles,
    listBoxStyles,
    listBoxButtonStyle,
    listBoxButtonSize,
    isPlaceholder,
    placeholder,
    selectedData,
    disabled,
    optionsDataCy,
    options,
    operationsIDs,
    rejectedOperationIDs,
    isStaff,
    listOptionStyles,
    listOptionSize,
    optionsAnchor,
}: SelectContentProps) => {
    const [resolvedAnchor, setResolvedAnchor] = useState<SelectAnchor | undefined>(optionsAnchor);

    useEffect(() => {
        setResolvedAnchor(optionsAnchor);
    }, [optionsAnchor]);

    return (
        <>
            {label && (
                <div className="flex items-center gap-2">
                    <Typography element="p" size={labelSize}>
                        <Label className={labelStyles}>{label}</Label>
                    </Typography>
                    {labelAddon}
                </div>
            )}
            <div className={`relative mt-2 ${listBoxStyles}`}>
                <ListboxButton className={listBoxButtonStyle}>
                    <Typography
                        element="span"
                        size={listBoxButtonSize}
                        className={cn(
                            "ml-3 block truncate",
                            isPlaceholder
                                ? "text-placeholder font-normal"
                                : "text-gray-primary font-normal",
                        )}
                    >
                        {isPlaceholder ? (placeholder ?? "Selecione...") : selectedData?.value}
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
                    anchor={resolvedAnchor}
                    data-cy={optionsDataCy}
                    className={cn(
                        "z-9999 overflow-auto rounded-md bg-white py-1",
                        "text-base shadow-lg ring-1 ring-black ring-opacity-5",
                        "focus:outline-none data-closed:data-leave:opacity-0",
                        "data-leave:transition data-leave:duration-100 data-leave:ease-in",
                        "sm:text-sm",
                        resolvedAnchor ? "[--anchor-gap:4px]" : "absolute z-10 mt-1 w-full",
                    )}
                >
                    {options.map((option) => {
                        const listBoxOptionStyle = cn(
                            "group relative",
                            "cursor-default select-none",
                            "py-2 pl-3 pr-9",
                            "text-primary",
                            "data-focus:bg-primary data-focus:text-white",
                            {
                                "animate-warning": operationsIDs?.has(option.id),
                                "animate-danger": rejectedOperationIDs?.has(option.id) && !isStaff,
                            },
                            listOptionStyles,
                        );

                        const isSelected = selectedData?.id === option.id;

                        const typographyStyle = cn("block truncate", "ml-3", {
                            "font-semibold": isSelected,
                        });

                        const checkIconStyle = cn(
                            "absolute",
                            "inset-y-0 right-0 pr-4",
                            "flex items-center",
                            "text-primary",
                            "group-data-focus:text-white",
                            {
                                hidden: !isSelected,
                            },
                        );

                        return (
                            <ListboxOption
                                key={option.id}
                                value={option}
                                className={listBoxOptionStyle}
                            >
                                <div className="flex items-center">
                                    <Typography
                                        element="span"
                                        size={listOptionSize}
                                        className={typographyStyle}
                                    >
                                        {option.value}
                                    </Typography>
                                </div>

                                <span className={checkIconStyle}>
                                    <CheckIcon aria-hidden="true" className="h-5 w-5" />
                                </span>
                            </ListboxOption>
                        );
                    })}
                </ListboxOptions>
            </div>
        </>
    );
};

export type SelectData = {
    id: number;
    value: string;
};

export type SelectProps = {
    options: SelectData[];
    selectedData: SelectData | null;
    setSelect: (value: SelectData | null) => void;
    label?: string;
    labelAddon?: React.ReactNode;
    operationsIDs?: Set<number>;
    rejectedOperationIDs?: Set<number>;
    listBoxStyles?: string;
    listBoxButtonStyles?: string;
    listBoxButtonSize?: "sm" | "md" | "lg";
    listOptionStyles?: string;
    listOptionSize?: "sm" | "md" | "lg";
    labelStyles?: string;
    labelSize?: "sm" | "md" | "lg";
    disabled?: boolean;
    dataTestId?: string | undefined;
    dataCy?: string;
    placeholder?: string;
    optionsAnchor?: SelectAnchor;
};

/**
 * A customizable select component built with Headless UI's Listbox.
 *
 * @component
 * @param {Object} props - The component props
 * @param {SelectData[]} props.options - Array of options to display in the select dropdown
 * @param {SelectData} props.selectedData - Currently selected option
 * @param {(value: SelectData) => void} props.setSelect - Callback function to handle selection changes
 * @param {string} [props.label] - Optional label text for the select input
 * @param {Set<number>} [props.operationsIDs] - Set of option IDs that should show a warning state
 * @param {Set<number>} [props.rejectedOperationIDs] - Set of option IDs that should show an error state
 * @param {string} [props.listBoxStyles] - Additional CSS classes for the listbox container
 * @param {string} [props.listBoxButtonStyles] - Additional CSS classes for the listbox button
 * @param {'sm' | 'md' | 'lg'} [props.listBoxButtonSize] - Size of the listbox button text
 * @param {string} [props.listOptionStyles] - Additional CSS classes for the list options
 * @param {'sm' | 'md' | 'lg'} [props.listOptionSize] - Size of the list option text
 * @param {string} [props.labelStyles] - Additional CSS classes for the label
 * @param {'sm' | 'md' | 'lg'} [props.labelSize] - Size of the label text
 * @param {boolean} [props.disabled] - Whether the select is disabled
 * @param {string} [props.dataTestId] - Test ID for testing purposes
 *
 * @example
 * ```tsx
 * <Select
 *   options={[{ id: 1, value: 'Option 1' }, { id: 2, value: 'Option 2' }]}
 *   selectedData={{ id: 1, value: 'Option 1' }}
 *   setSelect={(value) => handleSelect(value)}
 *   label="Select an option"
 *   listBoxButtonSize="md"
 *   listOptionSize="md"
 *   labelSize="md"
 * />
 * ```
 *
 * @returns A select component with customizable styling, warning and error states,
 * and keyboard navigation support.
 */
const Select = ({
    options,
    selectedData,
    setSelect,
    label = "",
    labelAddon,
    operationsIDs,
    rejectedOperationIDs,
    listBoxStyles = "",
    listBoxButtonStyles = "",
    listBoxButtonSize = "sm",
    listOptionStyles = "",
    listOptionSize = "md",
    labelStyles = "",
    labelSize = "sm",
    disabled = false,
    dataTestId,
    dataCy,
    placeholder,
    optionsAnchor,
}: SelectProps) => {
    const [hasOperation, setHasOperation] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    const { data: userData } = useRetrieveUserQuery();
    const isStaff = userData?.role === Role.FMI || userData?.role === Role.GP;

    useEffect(() => {
        if (rejectedOperationIDs !== undefined && rejectedOperationIDs.size > 0) {
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
        "relative w-full rounded-md border-0 h-9 bg-white pr-10 sm:leading-6 flex items-center",
        "shadow-md ring-1 ring-inset",
        disabled ? "ring-tertiary" : "ring-primary",
        "text-left sm:text-sm",
        "focus:ring-2 focus:ring-inset focus:ring-primary",
        {
            "animate-warning": hasOperation,
            "animate-danger": isRejected && !isStaff,
        },
        listBoxButtonStyles,
    );

    const isPlaceholder = !selectedData;

    const optionsDataCy = dataCy ? `${dataCy}-options` : undefined;

    return (
        <div data-testid={dataTestId} data-cy={dataCy}>
            <Field disabled={disabled}>
                <Listbox value={selectedData} onChange={setSelect} by="id">
                    {() => (
                        <SelectContent
                            label={label}
                            labelAddon={labelAddon}
                            labelSize={labelSize}
                            labelStyles={labelStyles}
                            listBoxStyles={listBoxStyles}
                            listBoxButtonStyle={listBoxButtonStyle}
                            listBoxButtonSize={listBoxButtonSize}
                            isPlaceholder={isPlaceholder}
                            placeholder={placeholder}
                            selectedData={selectedData}
                            disabled={disabled}
                            optionsDataCy={optionsDataCy}
                            options={options}
                            operationsIDs={operationsIDs}
                            rejectedOperationIDs={rejectedOperationIDs}
                            isStaff={isStaff}
                            listOptionStyles={listOptionStyles}
                            listOptionSize={listOptionSize}
                            optionsAnchor={optionsAnchor}
                        />
                    )}
                </Listbox>
            </Field>
        </div>
    );
};

export default Select;
