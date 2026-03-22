import { TabList as HeadlessTabList } from "@headlessui/react";
import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";

type TabListProps = ComponentPropsWithoutRef<typeof HeadlessTabList>;

function TabList({ className, children, ...props }: TabListProps) {
    return (
        <HeadlessTabList
            {...props}
            className={clsx(
                "prophy-tab-list prophy-tab-list--subtle",
                "flex gap-2 overflow-x-auto rounded-xl p-1",
                "flex-nowrap sm:gap-1 sm:overflow-visible",
                className,
            )}
        >
            {children}
        </HeadlessTabList>
    );
}

export default TabList;