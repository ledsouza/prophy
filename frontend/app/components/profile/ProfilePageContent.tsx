"use client";

import { ErrorDisplay, Spinner } from "@/components/common";
import { ChangePasswordForm, ProfileForm } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

export default function ProfilePageContent() {
    const {
        data: user,
        isLoading,
        isError,
        refetch,
    } = useRetrieveUserQuery();

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Spinner />
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className="mx-auto max-w-5xl p-4 sm:p-6">
                <ErrorDisplay
                    title="Erro ao carregar perfil"
                    message="Não foi possível carregar os dados do seu perfil."
                    action={{
                        text: "Tentar novamente",
                        onClick: () => {
                            void refetch();
                        },
                    }}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6" data-cy="profile-page">
            <div className="mb-6">
                <Typography element="h1" size="title2" className="font-bold text-primary">
                    Meu perfil
                </Typography>
                <Typography element="p" size="md" className="mt-2 text-gray-secondary">
                    Gerencie seus dados pessoais e altere sua senha quando necessário.
                </Typography>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <ProfileForm user={user} />
                <ChangePasswordForm />
            </div>
        </div>
    );
}