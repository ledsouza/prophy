"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import clsx from "clsx";

type Props = {
    children: ReactNode;
    isOpen: boolean;
    onClose: (value: boolean) => void;
    className?: string;
};

const Modal = ({ children, isOpen, onClose, className }: Props) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const pointerUpRecentlyRef = useRef(false);
    const pointerDownInsidePanelRef = useRef(false);

    // Headless UI closes the dialog on `pointerup`, which also fires when the
    // user clicks or drags a scrollbar (scrollbars never emit a `click`).
    // Suppress every pointer-driven close here and instead close from a real
    // `click` (see handleClick). Escape and other non-pointer closes still
    // pass through, so Headless UI keeps owning Escape.
    useEffect(() => {
        if (!isOpen) return;

        const onPointerUp = () => {
            pointerUpRecentlyRef.current = true;
            // Clear on the next task so that Headless UI's synchronous
            // document-capture handler still sees the flag as true.
            setTimeout(() => {
                pointerUpRecentlyRef.current = false;
            }, 0);
        };

        // Window capture runs before Headless UI's document-capture handler,
        // so the flag is set by the time handleClose is invoked.
        window.addEventListener("pointerup", onPointerUp, true);
        return () => window.removeEventListener("pointerup", onPointerUp, true);
    }, [isOpen]);

    const handleClose = useCallback(
        (value: boolean) => {
            if (pointerUpRecentlyRef.current) return;
            onClose(value);
        },
        [onClose],
    );

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        pointerDownInsidePanelRef.current =
            panelRef.current?.contains(e.target as Node) ?? false;
    };

    // Drive legitimate backdrop closes from the real `click` event.
    // Scrollbar interactions never emit `click`, so they cannot close the modal.
    // Guard against drag-from-panel-to-backdrop (text selection) by checking
    // where the pointer-down originated.
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const clickedInsidePanel =
            panelRef.current?.contains(e.target as Node) ?? false;
        if (!pointerDownInsidePanelRef.current && !clickedInsidePanel) {
            onClose(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            className="relative z-10"
            data-testid="modal"
        >
            <DialogBackdrop
                transition
                className={clsx(
                    "fixed inset-0",
                    "bg-black/40",
                    "transition-opacity",
                    "data-closed:opacity-0",
                    "data-enter:duration-300 data-leave:duration-200",
                    "data-enter:ease-out data-leave:ease-in",
                )}
            />

            <div
                className="fixed inset-0 z-10 w-screen overflow-y-auto"
                data-cy="modal-scroll-container"
                onPointerDown={handlePointerDown}
                onClick={handleClick}
            >
                <div
                    className={clsx(
                        "flex min-h-full items-end justify-center",
                        "p-4 text-center sm:p-4",
                        "sm:items-center",
                    )}
                >
                    <DialogPanel
                        ref={panelRef}
                        transition
                        className={clsx(
                            "relative w-full max-w-full transform overflow-visible rounded-none",
                            "bg-white p-4 text-left shadow-xl sm:p-4",
                            "transition-all",
                            "data-closed:translate-y-4 data-closed:opacity-0",
                            "data-enter:duration-300 data-leave:duration-200",
                            "data-enter:ease-out data-leave:ease-in",
                            "sm:w-full sm:rounded-lg",
                            "data-closed:sm:translate-y-0 data-closed:sm:scale-95",
                            className,
                        )}
                    >
                        {children}
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default Modal;
