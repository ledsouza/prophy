import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input, Select, type SelectData } from "@/components/forms";
import Role from "@/enums/Role";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import {
    COMMERCIAL_MANAGEABLE_ROLES,
    MANAGEABLE_ROLE_OPTIONS,
    MANAGEABLE_ROLES,
} from "@/utils/roles";

import type { ManagedUserFormFields } from "@/schemas";

type ManagedUserFieldsProps = {
    mode: "create" | "edit";
    register: UseFormRegister<ManagedUserFormFields>;
    errors: FieldErrors<ManagedUserFormFields>;
    roleOption: SelectData | null;
    setRoleOption: (value: SelectData | null) => void;
};

const ManagedUserFields = ({
    mode,
    register,
    errors,
    roleOption,
    setRoleOption,
}: ManagedUserFieldsProps) => {
    const dataCyPrefix = mode === "create" ? "gp-users-create" : "gp-users-edit";
    const { data: currentUser } = useRetrieveUserQuery();
    const isCommercial = currentUser?.role === Role.C;
    const roleOptions = isCommercial
        ? MANAGEABLE_ROLES.filter((role) => COMMERCIAL_MANAGEABLE_ROLES.has(role.role)).map(
              (roleOption) =>
                  MANAGEABLE_ROLE_OPTIONS.find((option) => option.value === roleOption.label),
          )
        : MANAGEABLE_ROLE_OPTIONS;
    const filteredRoleOptions = roleOptions.filter((option): option is SelectData =>
        Boolean(option),
    );

    return (
        <>
            <Input
                {...register("cpf")}
                label="CPF"
                placeholder="Apenas dígitos"
                dataCy={`${dataCyPrefix}-cpf`}
                errorMessage={errors.cpf?.message}
            />

            <Input
                {...register("name")}
                label="Nome"
                dataCy={`${dataCyPrefix}-name`}
                errorMessage={errors.name?.message}
            />

            <Input
                {...register("email")}
                label="E-mail"
                dataCy={`${dataCyPrefix}-email`}
                errorMessage={errors.email?.message}
            />

            <Input
                {...register("phone")}
                label="Celular"
                placeholder="DD9XXXXXXXX"
                dataCy={`${dataCyPrefix}-phone`}
                errorMessage={errors.phone?.message}
            />

            <Select
                options={filteredRoleOptions}
                selectedData={roleOption}
                setSelect={setRoleOption}
                label="Perfil"
                dataCy={`${dataCyPrefix}-role`}
            />
        </>
    );
};

export default ManagedUserFields;
