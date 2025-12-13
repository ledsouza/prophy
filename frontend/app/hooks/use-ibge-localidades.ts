"use client";

import { ComboboxDataProps } from "@/components/forms/ComboBox";
import {
    useGetEstadosQuery,
    useGetMunicipiosByEstadosIdQuery,
} from "@/redux/services/ibgeApiSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { useCallback, useEffect, useState } from "react";
import { UseFormSetValue } from "react-hook-form";

const useIBGELocalidades = (setValue: UseFormSetValue<any>) => {
    const {
        data: estados,
        isSuccess: isEstadosSuccess,
        error: estadosError,
    } = useGetEstadosQuery();
    const [selectedEstado, setSelectedEstado] = useState<ComboboxDataProps | null>(null);

    if (estadosError) {
        console.error("useGetEstadosQuery error: ", estadosError);
    }

    const {
        data: municipios,
        isSuccess: isMunicipiosSuccess,
        error: municipiosError,
    } = useGetMunicipiosByEstadosIdQuery(selectedEstado?.id ?? skipToken);
    const [selectedMunicipio, setSelectedMunicipio] = useState<ComboboxDataProps | null>(null);

    if (municipiosError) {
        console.error("useGetMunicipiosByEstadosIdQuery error: ", municipiosError);
    }

    const cleanSelectedMunicipio = useCallback(() => {
        if (!selectedEstado) {
            setSelectedMunicipio(null);
        }
    }, [selectedEstado]);

    useEffect(() => {
        cleanSelectedMunicipio();
    }, [cleanSelectedMunicipio]);

    const handleEstadoChange = useCallback(
        (newSelectedEstado: ComboboxDataProps | null) => {
            setSelectedEstado((currentSelectedEstado) => {
                const currentId = currentSelectedEstado?.id ?? null;
                const nextId = newSelectedEstado?.id ?? null;

                if (currentId === nextId) {
                    return currentSelectedEstado;
                }

                return newSelectedEstado;
            });

            if (newSelectedEstado) {
                setValue("state", newSelectedEstado.sigla, { shouldValidate: true });
                return;
            }

            setValue("state", "", { shouldValidate: true });
            setValue("city", "", { shouldValidate: true });
        },
        [setValue]
    );

    const handleMunicipioChange = useCallback(
        (newSelectedMunicipio: ComboboxDataProps | null) => {
            setSelectedMunicipio((currentSelectedMunicipio) => {
                const currentId = currentSelectedMunicipio?.id ?? null;
                const nextId = newSelectedMunicipio?.id ?? null;

                if (currentId === nextId) {
                    return currentSelectedMunicipio;
                }

                return newSelectedMunicipio;
            });

            setValue("city", newSelectedMunicipio?.name || "", { shouldValidate: true });
        },
        [setValue]
    );

    return {
        estados,
        isEstadosSuccess,
        estadosError,
        selectedEstado,
        handleEstadoChange,
        municipios,
        isMunicipiosSuccess,
        municipiosError,
        selectedMunicipio,
        handleMunicipioChange,
    };
};

export default useIBGELocalidades;
