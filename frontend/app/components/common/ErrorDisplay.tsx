"use client";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";

type ErrorDisplayProps = {
    title: string;
    message: string;
    action?: {
        text: string;
        onClick: () => void;
    };
};

function ErrorDisplay({ title, message, action }: ErrorDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-8">
            <Typography element="h2" size="title2" className="font-bold text-danger">
                {title}
            </Typography>
            <Typography element="p" size="lg">
                {message}
            </Typography>
            {action && (
                <Button onClick={action.onClick} variant="secondary">
                    {action.text}
                </Button>
            )}
        </div>
    );
}

export default ErrorDisplay;
