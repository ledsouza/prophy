import clsx from "clsx";
import type { ReactNode } from "react";

type MobileResultField = {
    label: string;
    value: ReactNode;
};

type MobileResultCardProps = {
    title?: ReactNode;
    badge?: ReactNode;
    fields: MobileResultField[];
    actions?: ReactNode;
    className?: string;
    dataCy?: string;
};

const MobileResultCard = ({
    title,
    badge,
    fields,
    actions,
    className,
    dataCy,
}: MobileResultCardProps) => {
    return (
        <div
            data-cy={dataCy}
            className={clsx(
                "rounded-xl border border-gray-200 bg-white p-4 shadow-sm",
                "flex flex-col gap-4",
                className,
            )}
        >
            {(title || badge) && (
                <div className="flex flex-col items-start gap-2">
                    {title && <div className="text-sm font-semibold text-gray-900">{title}</div>}
                    {badge && <div className="shrink-0">{badge}</div>}
                </div>
            )}
            <div className="flex flex-col gap-3">
                {fields.map((field) => (
                    <div key={field.label} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-gray-secondary">
                            {field.label}
                        </span>
                        <div className="text-sm text-gray-900 wrap-break-word">{field.value}</div>
                    </div>
                ))}
            </div>
            {actions && <div className="flex flex-col gap-2">{actions}</div>}
        </div>
    );
};

export type { MobileResultField };
export default MobileResultCard;
