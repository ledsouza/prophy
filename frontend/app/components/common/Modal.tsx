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
                        "p-4 text-center sm:p-4",
                        "sm:items-center",
                    )}
                >
                    <DialogPanel
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
