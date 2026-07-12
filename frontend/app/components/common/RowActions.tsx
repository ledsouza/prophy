import clsx from "clsx";
import type { ReactNode } from "react";
import Button, { ButtonVariant } from "./Button";

type RowAction = {
    key: string;
    label: ReactNode;
    variant?: ButtonVariant;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
    dataCy?: string;
    dataTestId?: string;
};

type RowActionsProps = {
    actions: RowAction[];
    before?: ReactNode;
};

const RowActions = ({ actions, before }: RowActionsProps) => (
    <div className="flex flex-col items-stretch gap-2">
        {before}
        {actions.map((action) => (
            <Button
                key={action.key}
                variant={action.variant ?? "primary"}
                onClick={action.onClick}
                disabled={action.disabled}
                isLoading={action.isLoading}
                dataCy={action.dataCy}
                dataTestId={action.dataTestId}
                className={clsx("w-full text-xs", action.className)}
            >
                {action.label}
            </Button>
        ))}
    </div>
);

export type { RowAction };
export default RowActions;
