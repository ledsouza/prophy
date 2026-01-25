"use client";

import { useVerify } from "@/hooks";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const contextClass = {
    success: "bg-white text-gray-primary",
    error: "bg-white text-gray-primary",
    info: "bg-white text-gray-primary",
    warning: "bg-white text-gray-primary",
    default: "bg-white text-gray-primary",
    dark: "bg-white text-gray-primary",
};

const Setup = () => {
    useVerify();
    return (
        <>
            <style jsx global>{`
                :root {
                    --toastify-color-success: rgb(var(--success));
                }
                .Toastify__toast-icon svg {
                    margin-bottom: 6px;
                }

                .Toastify__toast-body {
                    color: rgba(var(--text-primary), 1);
                    flex: 1;
                    margin: 0;
                    min-width: 0;
                    white-space: normal;
                    word-break: break-word;
                }

                .Toastify__close-button {
                    position: absolute;
                    right: 0.75rem;
                    top: 0.75rem;
                }
            `}</style>
            <ToastContainer
                data-cy="toast-container"
                toastClassName={(context) =>
                    contextClass[context?.type || "default"] +
                    " relative flex gap-2 p-3 pr-12 min-h-12 rounded-md cursor-pointer"
                }
                position="top-right"
                autoClose={3000}
            />
        </>
    );
};

export default Setup;
