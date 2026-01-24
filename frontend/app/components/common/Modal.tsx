"use client";

import { ReactNode } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import clsx from "clsx";

type Props = {
    children: ReactNode;
    isOpen: boolean;
    onClose: (value: boolean) => void;
    className?: string;
};

/**
 * Modal: controlled, accessible dialog built on @headlessui/react Dialog.
 * Renders a full-screen backdrop and a centered panel with transitions.
 *
 * Spacing with className (per consumer):
 * - Apply p-* to set inner padding of the white panel (e.g., p-6, p-8).
 * - Add mx-* to keep horizontal gutter on small screens (e.g., mx-6).
 * - Constrain width with max-w-* (works with default sm:w-full).
 * - Default vertical margin is sm:my-8; override with sm:my-0 or a custom value.
 *   Tailwind utilities in className come last, so matching breakpoint utilities
 *   override defaults.
 *
 * Example:
 *   <Modal isOpen={open} onClose={setOpen} className="max-w-4xl mx-6 p-8">
 *     <MyForm />
 *   </Modal>
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Modal content.
 * @param {boolean} props.isOpen - Controls visibility.
 * @param {(value: boolean) => void} props.onClose - Called on backdrop/ESC to close.
 * @param {string} [props.className] - Tailwind classes for the panel (padding, margins, width).
 */
const Modal = ({ children, isOpen, onClose, className }: Props) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-10" data-testid="modal">
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

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div
                    className={clsx(
                        "flex min-h-full items-end justify-center",
                        "p-2 text-center",
                        "sm:items-center sm:p-0",
                    )}
                >
                    <DialogPanel
                        transition
                        className={clsx(
                            "relative transform overflow-visible rounded-lg",
                            "bg-white text-left shadow-xl",
                            "transition-all",
                            "data-closed:translate-y-4 data-closed:opacity-0",
                            "data-enter:duration-300 data-leave:duration-200",
                            "data-enter:ease-out data-leave:ease-in",
                            "sm:my-8 sm:w-full",
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
