import { SearchTab } from "@/types/search";
import { SelectData } from "@/components/forms/Select";
import { USER_ROLE_MAP, CONTRACT_TYPE_MAP, OPERATION_STATUS_MAP } from "@/constants/search";
import { getTabFromParam } from "./urlUtils";

export const restoreTabState = (
    tabParam: string | null,
    setSelectedTabIndex: (index: SearchTab) => void
) => {
    setSelectedTabIndex(getTabFromParam(tabParam));
};

export const restorePageState = (
    pageParam: string | null,
    currentPage: number,
    setCurrentPage: (page: number) => void
) => {
    if (pageParam) {
        const page = parseInt(pageParam, 10);
        if (page > 0 && page !== currentPage) {
            setCurrentPage(page);
        }
    }
};

export const restoreFilterStatesFromUrl = (
    name: string,
    cnpj: string,
    city: string,
    setSelectedName: (name: string) => void,
    setSelectedCnpj: (cnpj: string) => void,
    setSelectedCity: (city: string) => void
) => {
    setSelectedName(name);
    setSelectedCnpj(cnpj);
    setSelectedCity(city);
};

export const restoreSelectOptions = (
    roleId: string | null,
    contractTypeId: string | null,
    operationStatusId: string | null,
    userRoleOptions: SelectData[],
    contractTypeOptions: SelectData[],
    operationStatusOptions: SelectData[],
    setSelectedUserRole: (role: SelectData) => void,
    setSelectedContractType: (type: SelectData) => void,
    setSelectedOperationStatus: (status: SelectData) => void
) => {
    const role = roleId ? userRoleOptions.find((r) => r.id === Number(roleId)) : null;
    if (role) setSelectedUserRole(role);

    const contract = contractTypeId
        ? contractTypeOptions.find((c) => c.id === Number(contractTypeId))
        : null;
    if (contract) setSelectedContractType(contract);

    const status = operationStatusId
        ? operationStatusOptions.find((s) => s.id === Number(operationStatusId))
        : null;
    if (status) setSelectedOperationStatus(status);
};

export const getUserRoleFromOptionId = (optionId: number): string => {
    return USER_ROLE_MAP[optionId] || "";
};

export const getContractTypeFromOptionId = (optionId: number): string => {
    return CONTRACT_TYPE_MAP[optionId] || "";
};

export const getOperationStatusFromOptionId = (optionId: number): string => {
    return OPERATION_STATUS_MAP[optionId] || "";
};

export const applyFiltersFromUrl = (
    name: string,
    cnpj: string,
    city: string,
    roleId: string | null,
    contractTypeId: string | null,
    operationStatusId: string | null,
    setAppliedFilters: (filters: any) => void
) => {
    const filters = {
        name,
        cnpj,
        city,
        user_role: getUserRoleFromOptionId(Number(roleId) || 0),
        contract_type: getContractTypeFromOptionId(Number(contractTypeId) || 0),
        operation_status: getOperationStatusFromOptionId(Number(operationStatusId) || 0),
    };

    setAppliedFilters(filters);
};
