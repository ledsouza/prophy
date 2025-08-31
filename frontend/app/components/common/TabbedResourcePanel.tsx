"use client";

import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ReactNode, useState } from "react";

import { Tab } from "@/components/common";
import { Typography } from "@/components/foundation";
import clsx from "clsx";

type TabConfig = {
    id: string;
    label: string;
    render: () => ReactNode;
    badgeCount?: number;
    tabTestId?: string;
};

type ClassNames = {
    container?: string;
    header?: string;
    tabs?: string;
    body?: string;
};

type TabbedResourcePanelProps = {
    tabs: TabConfig[];
    initialTabId?: string;
    onTabChange?: (id: string) => void;
    classNames?: ClassNames;
};

/**
 * A responsive, accessible tabbed panel shell for rendering resource sections within a
 * card-like container. Renders a title and a Headless UI TabGroup with a tab list and panels.
 * The component is presentation/behavior only; callers provide per-tab render functions.
 *
 * Props
 * @param {TabConfig[]} tabs
 *   Tab definitions. For each item:
 *   - {string} id: Stable identifier used for selection and analytics.
 *   - {string} label: Human‑readable tab label.
 *   - {() => ReactNode} render: Render function invoked for the tab’s panel.
 *   - {number} [badgeCount]: Optional numeric badge shown next to the label.
 *   - {string} [tabTestId]: Optional data-testid applied to the tab button element.
 * @param {string} [initialTabId]
 *   If provided, sets the initially selected tab by id (applied once on mount).
 * @param {(id: string) => void} [onTabChange]
 *   Callback fired when the selected tab changes, receiving the active tab id.
 *   Useful for syncing external state, deep‑linking, or analytics.
 * @param {Object} [classNames]
 *   Optional className overrides to customize layout:
 *   - {string} [classNames.container]: Additional classes for the outer container.
 *   - {string} [classNames.header]: Additional classes for the header (title + tabs).
 *   - {string} [classNames.tabs]: Additional classes for the TabList element.
 *   - {string} [classNames.body]: Additional classes for the TabPanels element.
 *
 * Behavior/Notes
 * - Uses Headless UI tabs for keyboard and ARIA support.
 * - initialTabId influences only the first render; the component is otherwise uncontrolled.
 * - Use onTabChange to observe and react to selection changes outside this component.
 */
const TabbedResourcePanel = ({
    tabs,
    initialTabId,
    onTabChange,
    classNames = {},
}: TabbedResourcePanelProps) => {
    const initialIndex = initialTabId
        ? Math.max(
              0,
              tabs.findIndex((t) => t.id === initialTabId)
          )
        : 0;
    const [selectedIndex, setSelectedIndex] = useState(Math.min(initialIndex, tabs.length - 1));

    const handleChange = (index: number) => {
        setSelectedIndex(index);
        onTabChange?.(tabs[index]?.id);
    };

    return (
        <div
            className={clsx(
                "flex flex-col overflow-hidden",
                "w-full md:w-2/3 h-[60vh] md:h-[80vh]",
                "gap-4 p-6 md:p-8",
                "bg-white rounded-xl shadow-lg",
                classNames.container
            )}
        >
            <div className={clsx("flex flex-col", "gap-4", classNames.header)}>
                <TabGroup selectedIndex={selectedIndex} onChange={handleChange}>
                    <TabList
                        className={clsx(
                            "flex space-x-1",
                            "rounded-xl bg-primary/20",
                            "p-1",
                            classNames.tabs
                        )}
                    >
                        {tabs.map((t) => (
                            <Tab key={t.id}>
                                <div
                                    className="flex items-center gap-2"
                                    data-testid={t.tabTestId || `tab-${t.id}`}
                                >
                                    <span>{t.label}</span>
                                    {typeof t.badgeCount === "number" && (
                                        <span
                                            className={clsx(
                                                "inline-flex items-center justify-center",
                                                "rounded-full bg-primary px-2 py-0.5",
                                                "text-xs font-semibold text-white"
                                            )}
                                        >
                                            {t.badgeCount}
                                        </span>
                                    )}
                                </div>
                            </Tab>
                        ))}
                    </TabList>

                    <TabPanels className={clsx("flex-1 overflow-y-auto", classNames.body)}>
                        {tabs.map((t) => (
                            <TabPanel key={t.id} className="focus:outline-none h-full">
                                {t.render()}
                            </TabPanel>
                        ))}
                    </TabPanels>
                </TabGroup>
            </div>
        </div>
    );
};

export default TabbedResourcePanel;
