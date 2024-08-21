import { ChangeEvent } from "react";

type Props = {
    labelId: string;
    type: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    value: string;
    children: React.ReactNode;
    required?: boolean;
};

export default function Input({
    labelId,
    type,
    onChange,
    value,
    children,
    required = false,
}: Props) {
    return (
        <div>
            <div className="flex justify-between align-center">
                <label
                    htmlFor={labelId}
                    className="block text-sm font-medium leading-6 text-gray-900"
                >
                    {children}
                </label>
            </div>
            <div className="mt-2">
                <input
                    id={labelId}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    name={labelId}
                    type={type}
                    onChange={onChange}
                    value={value}
                    required={required}
                />
            </div>
        </div>
    );
}
