import React from "react";

type ColumnDefinition<T> = {
    header: string;
    cell: (row: T) => React.ReactNode;
};

type TableProps<T> = {
    data: T[];
    columns: ColumnDefinition<T>[];
    keyExtractor: (row: T) => string | number;
};

const Table = <T extends {}>({ data, columns, keyExtractor }: TableProps<T>) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
                <thead>
                    <tr className="bg-gray-50">
                        {columns.map((column) => (
                            <th
                                key={column.header}
                                className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((row) => (
                        <tr key={keyExtractor(row)} className="hover:bg-gray-50">
                            {columns.map((column) => (
                                <td key={column.header} className="px-4 py-3 text-sm text-gray-900">
                                    {column.cell(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
