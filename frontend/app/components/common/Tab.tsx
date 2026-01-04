import { Tab as HeadlessTab } from "@headlessui/react";
import type { ComponentPropsWithoutRef } from "react";

type TabProps = ComponentPropsWithoutRef<typeof HeadlessTab>;

function Tab({ children, ...props }: TabProps) {
    return (
        <HeadlessTab
            {...props}
            className={({ selected }: { selected: boolean }) =>
                `w-full rounded-lg py-2.5 px-3 text-sm font-medium leading-5 
                ${
                    selected
                        ? "bg-white text-primary shadow"
                        : "text-gray-700 hover:bg-white/[0.4] hover:text-primary"
                }`
            }
        >
            {children}
        </HeadlessTab>
    );
}

export default Tab;
