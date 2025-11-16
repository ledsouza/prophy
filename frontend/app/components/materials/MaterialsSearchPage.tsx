"use client";

import { LockOpenIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button, ErrorDisplay, Modal, Pagination, Spinner, Table } from "@/components/common";
import { Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";

import {
    INTERNAL_CATEGORY_OPTIONS,
    PUBLIC_CATEGORY_OPTIONS,
    VISIBILITY_OPTIONS,
    getCategoryLabel,
    getCategoryOptionsForVisibility,
} from "@/constants/materials";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import Role from "@/enums/Role";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import {
    useLazyDownloadMaterialFileQuery,
    useListMaterialsQuery,
    useDeleteMaterialMutation,
} from "@/redux/features/materialApiSlice";
import type { MaterialCategoryCode, MaterialDTO, MaterialVisibility } from "@/types/material";
import { restoreTextFilterStates } from "@/utils/filter-restoration";
import { buildStandardUrlParams } from "@/utils/url-params";
import MaterialForm from "./MaterialForm";
import MaterialUpdateForm from "./MaterialUpdateForm";
import ConfirmDelete from "@/components/common/ConfirmDelete";
import { toast } from "react-toastify";

type MaterialFilters = {
    visibility: "" | MaterialVisibility;
    category: "" | MaterialCategoryCode;
    search: string;
};

const tabName = "materials";
const pageKey = "materials_page";
const paramPrefix = "materials";

const formatISODate = (iso: string) => {
    try {
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${dd}/${mm}/${yyyy}`;
    } catch {
        return iso;
    }
};

const MaterialsSearchPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { data: user } = useRetrieveUserQuery();
    const role = user?.role;

    const isProphyManager = role === Role.GP;
    const isInternalMP = role === Role.FMI;
    const isExternalMP = role === Role.FME;
    const isClientGeneralManager = role === Role.GGC;
    const isUnitManager = role === Role.GU;

    const canUpload = isProphyManager || isInternalMP || isExternalMP;
    const isInternal = isProphyManager || isInternalMP;

    // State
    const [currentPage, setCurrentPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState<MaterialFilters>({
        visibility: "",
        category: "",
        search: "",
    });

    // UI filter state
    const initialVisibilityOption =
        isClientGeneralManager || isUnitManager ? VISIBILITY_OPTIONS[1] : VISIBILITY_OPTIONS[0];
    const [selectedVisibility, setSelectedVisibility] = useState<{
        id: number;
        value: string;
        code?: MaterialVisibility;
    }>(initialVisibilityOption);
    const [selectedCategory, setSelectedCategory] = useState<{
        id: number;
        value: string;
        code?: MaterialCategoryCode;
    }>({
        id: 0,
        value: "Todos",
    });
    const [searchText, setSearchText] = useState("");

    // Derived options considering role and selected visibility
    const visibilityOptions = useMemo(() => {
        if (isClientGeneralManager || isUnitManager) {
            return VISIBILITY_OPTIONS.filter((o) => o.code === "PUB");
        }
        return VISIBILITY_OPTIONS;
    }, [isClientGeneralManager, isUnitManager]);

    const categoryOptions = useMemo(() => {
        return getCategoryOptionsForVisibility(selectedVisibility.code);
    }, [selectedVisibility]);

    // Build query args for API
    const queryArgs = useMemo(() => {
        const args: any = { page: currentPage };
        if (appliedFilters.visibility) args.visibility = appliedFilters.visibility;
        if (appliedFilters.category) args.category = appliedFilters.category;
        if (appliedFilters.search) args.search = appliedFilters.search;
        return args;
    }, [currentPage, appliedFilters]);

    const { data, isLoading, isFetching, error } = useListMaterialsQuery(
        Object.keys(queryArgs).length > 0 ? queryArgs : { page: currentPage }
    );
    const [triggerDownload] = useLazyDownloadMaterialFileQuery();
    const [deleteMaterial] = useDeleteMaterialMutation();

    const results = data?.results || [];
    const totalCount = data?.count || 0;

    // Restoration from URL on first load + when params change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        const pageParam = params.get(pageKey);
        if (pageParam) {
            const p = parseInt(pageParam, 10);
            if (p > 0 && p !== currentPage) setCurrentPage(p);
        }

        const urlVisibility = params.get(`${paramPrefix}_visibility`);
        if (urlVisibility) {
            // Restrict options by role
            const list = visibilityOptions;
            const found = list.find((o) => o.code === urlVisibility);
            if (found) setSelectedVisibility(found);
        } else {
            // Reset to allowed default for role
            setSelectedVisibility(initialVisibilityOption);
        }

        // Category (depends on visibility)
        const urlCategory = params.get(`${paramPrefix}_category`) || "";
        // We'll set it after options are decided
        // Search
        const urlSearch = params.get(`${paramPrefix}_search`) || "";

        restoreTextFilterStates(urlSearch, setSearchText);

        // After setting visibility, compute category option
        const afterVisibilityOptions =
            !selectedVisibility.code || selectedVisibility.code === "PUB"
                ? [{ id: 0, value: "Todos" }, ...PUBLIC_CATEGORY_OPTIONS]
                : [{ id: 0, value: "Todos" }, ...INTERNAL_CATEGORY_OPTIONS];

        // If category exists in URL, select it
        if (urlCategory) {
            const foundCat =
                afterVisibilityOptions.find(
                    (o) => "code" in o && (o as any).code === urlCategory
                ) || null;
            if (foundCat) {
                setSelectedCategory(foundCat as any);
            } else {
                setSelectedCategory({ id: 0, value: "Todos" });
            }
        } else {
            setSelectedCategory({ id: 0, value: "Todos" });
        }

        // Applied filters reflect URL
        setAppliedFilters({
            visibility: (urlVisibility as MaterialVisibility) || "",
            category: (urlCategory as MaterialCategoryCode) || "",
            search: urlSearch,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleApplyFilters = () => {
        // Reset to page 1
        if (currentPage !== 1) setCurrentPage(1);

        const filters: MaterialFilters = {
            visibility: (selectedVisibility.code as MaterialVisibility) || "",
            category: (selectedCategory.code as MaterialCategoryCode) || "",
            search: searchText.trim(),
        };
        setAppliedFilters(filters);

        const params = buildStandardUrlParams({
            tabName,
            pageKey,
            page: 1,
            filters,
            paramPrefix,
        });
        router.push(`?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setCurrentPage(1);
        setSelectedVisibility(initialVisibilityOption);
        setSelectedCategory({ id: 0, value: "Todos" });
        setSearchText("");
        const empty: MaterialFilters = { visibility: "", category: "", search: "" };
        setAppliedFilters(empty);

        const params = buildStandardUrlParams({
            tabName,
            pageKey,
            page: 1,
            filters: empty,
            paramPrefix,
        });
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const params = buildStandardUrlParams({
            tabName,
            pageKey,
            page,
            filters: appliedFilters,
            paramPrefix,
        });
        router.push(`?${params.toString()}`);
    };

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<MaterialDTO | null>(null);

    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [materialToEdit, setMaterialToEdit] = useState<MaterialDTO | null>(null);

    const handleConfirmDelete = async (m: MaterialDTO) => {
        await deleteMaterial(m.id).unwrap();
        toast.success("Material excluído com sucesso.");
        setIsDeleteOpen(false);
        setMaterialToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsDeleteOpen(false);
        setMaterialToDelete(null);
    };

    const handleDownload = async (row: MaterialDTO) => {
        try {
            const blob = await triggerDownload(row.id).unwrap();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const fileName = row.file_name || `material_${row.id}`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            // Silent fail with small user feedback
            alert("Não foi possível baixar o arquivo. Tente novamente mais tarde.");
        }
    };

    if (error) {
        return (
            <ErrorDisplay
                title="Erro ao carregar materiais"
                message="Ocorreu um erro ao carregar os materiais. Tente novamente mais tarde."
            />
        );
    }

    return (
        <main className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <Typography element="h1" size="title2" className="font-bold">
                        Materiais Institucionais
                    </Typography>
                    {canUpload && (
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            data-testid="btn-open-create-material"
                        >
                            Adicionar Material
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {isInternal && (
                        <Select
                            options={visibilityOptions}
                            selectedData={selectedVisibility}
                            setSelect={setSelectedVisibility}
                            label="Visibilidade"
                            dataTestId="filter-material-visibility"
                        />
                    )}

                    <Select
                        options={categoryOptions}
                        selectedData={selectedCategory}
                        setSelect={setSelectedCategory}
                        label="Categoria"
                        dataTestId="filter-material-category"
                    />
                    <Input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Buscar por título"
                        label="Titulo"
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button
                        onClick={handleApplyFilters}
                        className="flex-1 sm:flex-initial"
                        disabled={isLoading || isFetching}
                        data-testid="btn-apply-material-filters"
                    >
                        {isFetching ? "Carregando..." : "Aplicar Filtros"}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleClearFilters}
                        className="flex-1 sm:flex-initial"
                        disabled={isFetching}
                        data-testid="btn-clear-material-filters"
                    >
                        Limpar Filtros
                    </Button>
                </div>

                {/* Results */}
                <div className="bg-gray-50 rounded-xl p-6">
                    <Typography element="h2" size="title3" className="font-bold mb-4">
                        Resultados
                    </Typography>

                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <Spinner />
                        </div>
                    )}

                    {!isLoading && results.length === 0 ? (
                        <div className="text-center py-8">
                            <Typography element="p" size="lg" className="text-gray-secondary">
                                Nenhum material encontrado com os filtros aplicados
                            </Typography>
                        </div>
                    ) : (
                        !isLoading && (
                            <>
                                <Table
                                    data={results}
                                    keyExtractor={(row: MaterialDTO) => row.id}
                                    columns={[
                                        {
                                            header: "Título",
                                            cell: (row: MaterialDTO) => (
                                                <div className="flex items-center gap-2">
                                                    {row.visibility === "PUB" ? (
                                                        <span
                                                            className="inline-flex items-center"
                                                            title="Público"
                                                        >
                                                            <LockOpenIcon
                                                                size={14}
                                                                weight="bold"
                                                                className="text-emerald-600/60"
                                                                aria-hidden="true"
                                                            />
                                                            <span className="sr-only">Público</span>
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="inline-flex items-center"
                                                            title="Interno"
                                                        >
                                                            <LockSimpleIcon
                                                                size={14}
                                                                weight="bold"
                                                                className="text-gray-500/70"
                                                                aria-hidden="true"
                                                            />
                                                            <span className="sr-only">Interno</span>
                                                        </span>
                                                    )}
                                                    <span>{row.title}</span>
                                                </div>
                                            ),
                                        },
                                        {
                                            header: "Descrição",
                                            cell: (row: MaterialDTO) => row.description || "-",
                                            width: "28rem",
                                            multiLine: true,
                                        },
                                        {
                                            header: "Categoria",
                                            cell: (row: MaterialDTO) =>
                                                getCategoryLabel(row.category),
                                        },
                                        {
                                            header: "Criado em",
                                            cell: (row: MaterialDTO) =>
                                                formatISODate(row.created_at),
                                            width: "1rem",
                                        },
                                        {
                                            header: "Atualizado em",
                                            cell: (row: MaterialDTO) =>
                                                formatISODate(row.updated_at),
                                            width: "1rem",
                                        },
                                        {
                                            header: "Ações",
                                            width: "8rem",
                                            cell: (row: MaterialDTO) => (
                                                <div className="flex flex-col gap-2 items-stretch">
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handleDownload(row)}
                                                        className="w-full text-xs"
                                                    >
                                                        Baixar
                                                    </Button>
                                                    {isProphyManager && (
                                                        <>
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => {
                                                                    setMaterialToEdit(row);
                                                                    setIsUpdateOpen(true);
                                                                }}
                                                                className="w-full text-xs"
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                onClick={() => {
                                                                    setMaterialToDelete(row);
                                                                    setIsDeleteOpen(true);
                                                                }}
                                                                className="w-full text-xs"
                                                            >
                                                                Excluir
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            ),
                                        },
                                    ]}
                                />

                                {/* Pagination */}
                                {totalCount > ITEMS_PER_PAGE && (
                                    <div className="mt-6">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalCount={totalCount}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                            onPageChange={handlePageChange}
                                            isLoading={isFetching}
                                        />
                                    </div>
                                )}

                                {/* Results Summary */}
                                <div className="mt-4 text-center">
                                    <Typography
                                        element="p"
                                        size="sm"
                                        className="text-gray-secondary"
                                    >
                                        {totalCount > 0 &&
                                            `Mostrando ${Math.min(
                                                (currentPage - 1) * ITEMS_PER_PAGE + 1,
                                                totalCount
                                            )}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de ${totalCount} material(is)`}
                                        {totalCount === 0 && "Nenhum material encontrado"}
                                    </Typography>
                                </div>
                            </>
                        )
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {canUpload && (
                <Modal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    className="max-w-4xl mx-6 p-8"
                >
                    <MaterialForm
                        onSuccess={() => setIsCreateOpen(false)}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </Modal>
            )}

            {/* Delete Modal */}
            {isProphyManager && (
                <Modal
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    className="max-w-md mx-6 p-8"
                >
                    {materialToDelete && (
                        <ConfirmDelete
                            item={materialToDelete}
                            title="Excluir material"
                            getItemLabel={(m) => m.title}
                            onConfirm={handleConfirmDelete}
                            onCancel={handleCancelDelete}
                            confirmLabel="Excluir"
                            cancelLabel="Cancelar"
                            confirmTestId="btn-material-delete-submit"
                        />
                    )}
                </Modal>
            )}

            {/* Update Modal */}
            {isProphyManager && (
                <Modal
                    isOpen={isUpdateOpen}
                    onClose={() => setIsUpdateOpen(false)}
                    className="max-w-3xl mx-6 p-8"
                >
                    {materialToEdit && (
                        <MaterialUpdateForm
                            initial={materialToEdit}
                            onSuccess={() => {
                                setIsUpdateOpen(false);
                                setMaterialToEdit(null);
                            }}
                            onCancel={() => {
                                setIsUpdateOpen(false);
                                setMaterialToEdit(null);
                            }}
                        />
                    )}
                </Modal>
            )}
        </main>
    );
};

export default MaterialsSearchPage;
