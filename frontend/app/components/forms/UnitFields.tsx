import { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";

import { Spinner } from "@/components/common";
import { ComboBox, Input } from "@/components/forms";

type ComboOption = {
    id: number;
    name: string;
    sigla?: string;
};

type UnitFieldsProps<TFieldValues extends FieldValues> = {
    register: UseFormRegister<TFieldValues>;
    errors: FieldErrors<TFieldValues>;
    disabled?: boolean;
    estados?: Array<{ id: number; nome: string; sigla?: string }>;
    isEstadosSuccess: boolean;
    selectedEstado: ComboOption | null;
    handleEstadoChange: (value: ComboOption | null) => void;
    municipios?: Array<{ id: number; nome: string }>;
    isMunicipiosSuccess: boolean;
    selectedMunicipio: ComboOption | null;
    handleMunicipioChange: (value: ComboOption | null) => void;
};

const UnitFields = <TFieldValues extends FieldValues>({
    register,
    errors,
    disabled = false,
    estados,
    isEstadosSuccess,
    selectedEstado,
    handleEstadoChange,
    municipios,
    isMunicipiosSuccess,
    selectedMunicipio,
    handleMunicipioChange,
}: UnitFieldsProps<TFieldValues>) => {
    return (
        <>
            <Input
                {...register("name" as Path<TFieldValues>)}
                type="text"
                errorMessage={errors.name?.message?.toString()}
                placeholder="Digite o nome da unidade"
                disabled={disabled}
                data-testid="unit-name-input"
                label="Nome"
            />
            <Input
                {...register("cnpj" as Path<TFieldValues>)}
                type="text"
                errorMessage={errors.cnpj?.message?.toString()}
                placeholder="Digite o CNPJ da unidade"
                disabled={disabled}
                data-testid="unit-cnpj-input"
                label="CNPJ"
            />
            <Input
                {...register("email" as Path<TFieldValues>)}
                type="text"
                errorMessage={errors.email?.message?.toString()}
                placeholder="nome@email.com"
                disabled={disabled}
                data-testid="unit-email-input"
                label="E-mail"
            />
            <Input
                {...register("phone" as Path<TFieldValues>)}
                type="text"
                errorMessage={errors.phone?.message?.toString()}
                placeholder="DD9XXXXXXXX"
                disabled={disabled}
                data-testid="unit-phone-input"
                label="Telefone"
            />
            {isEstadosSuccess && estados ? (
                <ComboBox
                    data={estados.map((estado) => ({
                        id: estado.id,
                        name: estado.nome,
                        sigla: estado.sigla,
                    }))}
                    errorMessage={errors.state ? "Estado da instituição é obrigatório." : ""}
                    placeholder="Digite o estado e selecione"
                    selectedValue={selectedEstado}
                    onChange={handleEstadoChange}
                    disabled={disabled}
                    data-testid="unit-state-input"
                >
                    Estado
                </ComboBox>
            ) : (
                <div>
                    <Spinner />
                </div>
            )}
            {isMunicipiosSuccess && municipios && selectedEstado ? (
                <ComboBox
                    data={municipios.map((municipio) => ({
                        id: municipio.id,
                        name: municipio.nome,
                    }))}
                    errorMessage={errors.city ? "Cidade da instituição é obrigatória." : ""}
                    placeholder="Digite a cidade e selecione"
                    selectedValue={selectedMunicipio}
                    onChange={handleMunicipioChange}
                    disabled={disabled}
                    data-testid="unit-city-input"
                >
                    Cidade
                </ComboBox>
            ) : (
                <Input
                    disabled
                    errorMessage={errors.city ? "Cidade da instituição é obrigatória." : ""}
                    placeholder="Selecione um estado"
                    data-testid="unit-city-input"
                    label="Cidade"
                />
            )}
            <Input
                {...register("address" as Path<TFieldValues>)}
                type="text"
                errorMessage={errors.address?.message?.toString()}
                placeholder="Rua, número, bairro"
                disabled={disabled}
                data-testid="unit-address-input"
                label="Endereço"
            />
        </>
    );
};

export default UnitFields;