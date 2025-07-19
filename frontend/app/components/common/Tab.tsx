import { Tab as HeadlessTab } from "@headlessui/react";
import { ReactNode } from "react";

type TabProps = {
    children: ReactNode;
};

function Tab({ children }: TabProps) {
    return (
        <HeadlessTab
            className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${
                    selected
                        ? "bg-white text-primary shadow"
                        : "text-gray-700 hover:bg-white/[0.12] hover:text-primary"
                }`
            }
        >
            {children}
        </HeadlessTab>
    );
}

export default Tab;
