import { ComboboxDataProps } from "@/components/forms/ComboBox";
import { RegisterFields } from "@/components/forms/RegisterForm";
import {
    IBGEApiResponse,
    useGetEstadosQuery,
    useGetMunicipiosByEstadosIdQuery,
} from "@/redux/services/ibgeApiSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { useCallback, useEffect, useState } from "react";
import { UseFormSetValue } from "react-hook-form";

const useIBGELocalidades = (setValue: UseFormSetValue<RegisterFields>) => {
    const {
        data: estados,
        isSuccess: isEstadosSuccess,
        error: estadosError,
    } = useGetEstadosQuery();
    const [selectedEstado, setSelectedEstado] =
        useState<ComboboxDataProps | null>(null);

    if (estadosError) {
        console.error("useGetEstadosQuery error: ", estadosError);
    }

    const {
        data: municipios,
        isSuccess: isMunicipiosSuccess,
        error: municipiosError,
    } = useGetMunicipiosByEstadosIdQuery(selectedEstado?.id ?? skipToken);
    const [selectedMunicipio, setSelectedMunicipio] =
        useState<ComboboxDataProps | null>(null);

    if (municipiosError) {
        console.error(
            "useGetMunicipiosByEstadosIdQuery error: ",
            municipiosError
        );
    }

    const cleanSelectedMunicipio = useCallback(() => {
        if (!selectedEstado) {
            setSelectedMunicipio(null);
        }
    }, [selectedEstado]);

    useEffect(() => {
        cleanSelectedMunicipio();
    }, [cleanSelectedMunicipio]);

    const handleEstadoChange = (selectedEstado: ComboboxDataProps | null) => {
        setSelectedEstado(selectedEstado);
        setValue("estado_instituicao", selectedEstado?.sigla || "");
    };

    const handleMunicipioChange = (
        selectedMunicipio: ComboboxDataProps | null
    ) => {
        setSelectedMunicipio(selectedMunicipio);
        setValue("cidade_instituicao", selectedMunicipio?.name || "");
    };

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
