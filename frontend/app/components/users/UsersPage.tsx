"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import { Button, ErrorDisplay, Modal, Pagination, Spinner, Table } from "@/components/common";
import { CreateManagedUserForm, EditManagedUserForm, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { ManageUserAssociationsModal } from "@/components/users";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import {
    useCreateManagedUserMutation,
    useListManagedUsersQuery,
    useUpdateManagedUserMutation,
} from "@/redux/features/authApiSlice";
import { handleApiError } from "@/redux/services/errorHandling";
import type { ManagedUserFormFields } from "@/schemas";
import type { UserDTO } from "@/types/user";
import Role from "@/enums/Role";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { roleFromOption, roleLabel } from "@/utils/roles";

const UsersPage = () => {
    const [page, setPage] = useState(1);
    const [cpfFilter, setCpfFilter] = useState("");
    const [nameFilter, setNameFilter] = useState("");

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserDTO | null>(null);

    const [toggleActiveOpen, setToggleActiveOpen] = useState(false);
    const [toggleActiveUser, setToggleActiveUser] = useState<UserDTO | null>(null);
    const [toggleActiveTarget, setToggleActiveTarget] = useState<boolean>(false);
    const [associationsOpen, setAssociationsOpen] = useState(false);
    const [associationsUser, setAssociationsUser] = useState<UserDTO | null>(null);
    const { data: currentUser } = useRetrieveUserQuery();
    const isCommercial = currentUser?.role === Role.C;

    const {
        data: managedUsers,
        isLoading,
        isError,
    } = useListManagedUsersQuery({
        page,
        cpf: cpfFilter.length > 0 ? cpfFilter : undefined,
        name: nameFilter.length > 0 ? nameFilter : undefined,
    });

    const [createManagedUser, { isLoading: isCreating }] = useCreateManagedUserMutation();
    const [updateManagedUser, { isLoading: isUpdating }] = useUpdateManagedUserMutation();

    const users = useMemo(() => managedUsers?.results ?? [], [managedUsers?.results]);
    const totalCount = managedUsers?.count ?? 0;

    function openEdit(user: UserDTO) {
        setEditingUser(user);
        setEditOpen(true);
    }

    function openToggleActive(user: UserDTO, isActiveTarget: boolean) {
        setToggleActiveUser(user);
        setToggleActiveTarget(isActiveTarget);
        setToggleActiveOpen(true);
    }

    function closeToggleActive() {
        setToggleActiveOpen(false);
        setToggleActiveUser(null);
    }

    function openAssociations(user: UserDTO) {
        setAssociationsUser(user);
        setAssociationsOpen(true);
    }

    async function confirmToggleActive() {
        if (!toggleActiveUser) {
            return;
        }

        try {
            await updateManagedUser({
                id: toggleActiveUser.id,
                cpf: toggleActiveUser.cpf,
                name: toggleActiveUser.name,
                email: toggleActiveUser.email,
                phone: toggleActiveUser.phone,
                role: toggleActiveUser.role,
                is_active: toggleActiveTarget,
            }).unwrap();

            toast.success(
                toggleActiveTarget
                    ? "Usuário ativado com sucesso."
                    : "Usuário inativado com sucesso.",
            );
            closeToggleActive();
        } catch (error) {
            handleApiError(error, "Toggle user active");
        }
    }

    async function handleCreate(values: ManagedUserFormFields) {
        try {
            await createManagedUser({
                cpf: values.cpf,
                name: values.name,
                email: values.email,
                phone: values.phone,
                role: roleFromOption(values.roleOption),
                is_active: values.isActive,
            }).unwrap();

            toast.success("Usuário criado e e-mail de definição de senha enviado.");
            setCreateOpen(false);
        } catch (error) {
            handleApiError(error, "Create managed user");
        }
    }

    async function handleUpdate(values: ManagedUserFormFields) {
        if (!editingUser) {
            return;
        }

        try {
            await updateManagedUser({
                id: editingUser.id,
                cpf: values.cpf,
                name: values.name,
                email: values.email,
                phone: values.phone,
                role: roleFromOption(values.roleOption),
                is_active: values.isActive,
            }).unwrap();

            toast.success("Usuário atualizado com sucesso.");
            setEditOpen(false);
            setEditingUser(null);
        } catch (error) {
            handleApiError(error, "Update managed user");
        }
    }

    if (isLoading) {
        return <Spinner fullscreen />;
    }

    if (isError) {
        return (
            <ErrorDisplay
                title="Erro ao carregar usuários"
                message="Ocorreu um erro ao carregar a lista de usuários."
            />
        );
    }

    return (
        <main className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4" data-cy="gp-users-page">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <Typography element="h1" size="title2" className="font-bold">
                        Usuários
                    </Typography>

                    <Button onClick={() => setCreateOpen(true)} dataCy="gp-users-open-create">
                        Criar usuário
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <Input
                        value={cpfFilter}
                        onChange={(e) => {
                            setCpfFilter(e.target.value.replace(/\D/g, "").slice(0, 11));
                            setPage(1);
                        }}
                        placeholder="Digite o CPF"
                        label="CPF"
                        dataCy="gp-users-filter-cpf"
                    />

                    <Input
                        value={nameFilter}
                        onChange={(e) => {
                            setNameFilter(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Digite o nome"
                        label="Nome"
                        dataCy="gp-users-filter-name"
                    />
                </div>

                <div className="flex justify-start mb-6">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setCpfFilter("");
                            setNameFilter("");
                            setPage(1);
                        }}
                        dataCy="gp-users-filter-clear"
                        className="w-fit"
                    >
                        Limpar filtros
                    </Button>
                </div>

                <div className="bg-gray-50 rounded-xl p-6" data-cy="gp-users-results">
                    <Typography element="h2" size="title3" className="font-bold mb-4">
                        Resultados
                    </Typography>

                    {users.length === 0 ? (
                        <Typography element="p" size="md" className="text-gray-secondary">
                            Nenhum usuário encontrado.
                        </Typography>
                    ) : (
                        <Table
                            data={users}
                            columns={[
                                { header: "CPF", cell: (u: UserDTO) => u.cpf },
                                { header: "Nome", cell: (u: UserDTO) => u.name },
                                { header: "E-mail", cell: (u: UserDTO) => u.email },
                                { header: "Celular", cell: (u: UserDTO) => u.phone },
                                {
                                    header: "Perfil",
                                    cell: (u: UserDTO) => roleLabel(u.role),
                                },
                                {
                                    header: "Ativo",
                                    cell: (u: UserDTO) => (u.is_active ? "Sim" : "Não"),
                                },
                                {
                                    header: "Ações",
                                    cell: (u: UserDTO) => (
                                        <div className="flex flex-col gap-2 items-stretch">
                                            {!isCommercial && (
                                                <Button
                                                    variant="primary"
                                                    onClick={() => openEdit(u)}
                                                    className="w-full text-xs"
                                                    dataCy={`gp-users-edit-${u.id}`}
                                                >
                                                    Editar
                                                </Button>
                                            )}

                                            <Button
                                                variant="secondary"
                                                onClick={() => openAssociations(u)}
                                                className="w-full text-xs"
                                                dataCy={`gp-users-associations-${u.id}`}
                                            >
                                                Associações
                                            </Button>

                                            {!isCommercial &&
                                                (u.is_active ? (
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => openToggleActive(u, false)}
                                                        className="w-full text-xs"
                                                        dataCy={`gp-users-deactivate-${u.id}`}
                                                    >
                                                        Inativar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => openToggleActive(u, true)}
                                                        className="w-full text-xs"
                                                        dataCy={`gp-users-activate-${u.id}`}
                                                    >
                                                        Ativar
                                                    </Button>
                                                ))}
                                        </div>
                                    ),
                                },
                            ]}
                            keyExtractor={(u: UserDTO) => u.id}
                            rowProps={(u: UserDTO) => ({
                                "data-cy": `gp-users-row-${u.id}`,
                            })}
                        />
                    )}

                    {totalCount > ITEMS_PER_PAGE && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={page}
                                totalCount={totalCount}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPage}
                                isLoading={false}
                            />
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={createOpen} onClose={setCreateOpen} className="max-w-lg mx-6 p-6">
                <div data-cy="gp-users-create-modal">
                    <CreateManagedUserForm
                        onSubmit={handleCreate}
                        onCancel={() => setCreateOpen(false)}
                        isSubmitting={isCreating}
                    />
                </div>
            </Modal>

            <Modal isOpen={editOpen} onClose={setEditOpen} className="max-w-lg mx-6 p-6">
                <div data-cy="gp-users-edit-modal">
                    {editingUser ? (
                        <EditManagedUserForm
                            user={editingUser}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditOpen(false)}
                            isSubmitting={isUpdating}
                        />
                    ) : (
                        <Typography element="p" size="md" className="text-gray-secondary">
                            Selecione um usuário para editar.
                        </Typography>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={toggleActiveOpen}
                onClose={setToggleActiveOpen}
                className="max-w-lg mx-6 p-6"
            >
                <div data-cy="gp-users-toggle-active-modal">
                    <Typography element="h3" size="title3" className="font-semibold">
                        {toggleActiveTarget ? "Ativar usuário" : "Inativar usuário"}
                    </Typography>

                    <Typography element="p" size="md" className="mt-2 text-gray-secondary">
                        {toggleActiveUser
                            ? `Tem certeza que deseja ${toggleActiveTarget ? "ativar" : "inativar"} o usuário ${toggleActiveUser.name}?`
                            : "Selecione um usuário."}
                    </Typography>

                    <div className="flex gap-2 pt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={closeToggleActive}
                            className="w-full"
                            dataCy="gp-users-toggle-active-cancel"
                            disabled={isUpdating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant={toggleActiveTarget ? "primary" : "danger"}
                            onClick={confirmToggleActive}
                            className="w-full"
                            dataCy="gp-users-toggle-active-confirm"
                            disabled={isUpdating || !toggleActiveUser}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>

            <ManageUserAssociationsModal
                isOpen={associationsOpen}
                onClose={setAssociationsOpen}
                user={associationsUser}
            />
        </main>
    );
};

export default UsersPage;
