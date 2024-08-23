"use client";

import { ReactNode } from "react";
import { store } from "./store";
import { Provider } from "react-redux";

type Props = {
    children: ReactNode;
};

export default function CustomProvider({ children }: Props) {
    return <Provider store={store}>{children}</Provider>;
}
