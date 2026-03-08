import { Tab as HeadlessTab } from "@headlessui/react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

type TabProps = ComponentPropsWithoutRef<typeof HeadlessTab>;

function Tab({ children, ...props }: TabProps) {
    return (
        <HeadlessTab
            {...props}
            className={({ selected }: { selected: boolean }) =>
                clsx(
                    "prophy-tab min-w-max rounded-lg px-3 py-2 text-xs font-medium leading-5",
                    "sm:min-w-0 sm:w-full sm:py-2.5 sm:text-sm",
                    selected && "prophy-tab--selected",
                )
            }
        >
            {children}
        </HeadlessTab>
    );
}

export default Tab;
