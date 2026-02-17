"use client";

import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ReactNode, useState } from "react";

import { Tab } from "@/components/common";
import clsx from "clsx";

type TabConfig = {
    id: string;
    label: string;
    render: () => ReactNode;
    badgeCount?: number;
    tabTestId?: string;
    tabCy?: string;
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
 * A responsive, accessible shell for rendering resource sections inside a
 * card-like container. It renders a Headless UI TabGroup (tab list and panels).
 * The component is presentation/behavior only; callers provide per‑tab render functions.
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
 * - Mobile-first container sizing with flex; uses a fixed height to enable nested scroll areas.
 * - Each TabPanel is sized to allow nested scroll areas. Content rendered by tabs must provide its
 *   own scroll area (e.g., wrap lists with flex-1 overflow-y-auto) while keeping action buttons
 *   visible.
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
              tabs.findIndex((t) => t.id === initialTabId),
          )
        : 0;
    const [selectedIndex, setSelectedIndex] = useState(Math.min(initialIndex, tabs.length - 1));

    const handleChange = (index: number) => {
        setSelectedIndex(index);
        onTabChange?.(tabs[index]?.id);
    };

    return (
        <div
            data-cy="tabbed-resource-panel"
            className={clsx(
                "flex flex-col overflow-hidden",
                "w-full md:w-2/3",
                "h-[60vh] md:h-[80vh]",
                "gap-4 p-4 sm:p-6 lg:p-8",
                "bg-bg-surface rounded-xl shadow-lg",
                classNames.container,
            )}
        >
            <div className={clsx("flex flex-col min-h-0", "gap-4", classNames.header)}>
                <TabGroup
                    selectedIndex={selectedIndex}
                    onChange={handleChange}
                    className="h-full flex flex-col min-h-0"
                >
                    <TabList
                        className={clsx(
                            "flex gap-2 overflow-x-auto",
                            "rounded-xl bg-primary/20",
                            "p-1 mb-4",
                            "sm:gap-1 sm:overflow-visible",
                            classNames.tabs,
                        )}
                    >
                        {tabs.map((t) => (
                            <Tab key={t.id}>
                                <div
                                    className="flex items-center justify-center gap-2"
                                    data-testid={t.tabTestId || `tab-${t.id}`}
                                    data-cy={t.tabCy || `tab-${t.id}`}
                                >
                                    <span>{t.label}</span>
                                    {typeof t.badgeCount === "number" && (
                                        <span
                                            className={clsx(
                                                "inline-flex items-center justify-center",
                                                "rounded-full bg-primary px-2 py-0.5",
                                                "text-xs font-semibold text-white",
                                            )}
                                        >
                                            {t.badgeCount}
                                        </span>
                                    )}
                                </div>
                            </Tab>
                        ))}
                    </TabList>

                    <TabPanels className={clsx("flex-1 min-h-0", classNames.body)}>
                        {tabs.map((t) => (
                            <TabPanel key={t.id} className="focus:outline-none h-full min-h-0 px-2">
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
