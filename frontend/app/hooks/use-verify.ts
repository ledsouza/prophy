"use client";

import { useEffect } from "react";

import { useAppDispatch } from "@/redux/hooks";
import {
    setAuth,
    finishInitialLoad,
    setError,
} from "@/redux/features/authSlice";
import { useVerifyMutation } from "@/redux/features/authApiSlice";

export default function useVerify() {
    const dispatch = useAppDispatch();
    const [verify] = useVerifyMutation();

    useEffect(() => {
        verify()
            .unwrap()
            .then(() => {
                dispatch(setAuth());
            })
            .catch((error) => {
                // Status == 400 usuário sem access e refresh cookies no browser
                if (error.status === 400 || error.status === 401) {
                    dispatch(setError("Usuário não autorizado"));
                } else {
                    console.error(error);
                }
            })
            .finally(() => {
                dispatch(finishInitialLoad());
            });
    }, [dispatch, verify]);
}
