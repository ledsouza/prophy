"use client";

import { useVerify } from "@/hooks";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const contextClass = {
    success: "bg-white",
    error: "bg-white",
    info: "bg-white",
    warning: "bg-white",
    default: "bg-white",
    dark: "bg-white-600 font-gray-300",
};

const Setup = () => {
    useVerify();
    return (
        <>
            <style jsx global>{`
                :root {
                    --toastify-color-success: rgb(var(--primary));
                }
                .Toastify__toast-icon svg {
                    margin-bottom: 6px;
                }
            `}</style>
            <ToastContainer
                toastClassName={(context) =>
                    contextClass[context?.type || "default"] +
                    " relative flex p-2 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer"
                }
                bodyClassName={() =>
                    "text-base text-gray-primary font-med block p-3"
                }
                position="top-right"
                autoClose={5000}
            />
        </>
    );
};

export default Setup;
