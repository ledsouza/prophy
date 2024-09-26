"use client";

import { useAppSelector } from "./redux/hooks";
import { Typography } from "@/components/foundation";
import { ButtonLink } from "@/components/common";

const HomePage = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const authRedirect = isAuthenticated ? "/dashboard" : "/auth/login";

    return (
        <main>
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <Typography
                            element="h1"
                            size="title1"
                            variant="primary"
                            className="font-bold tracking-tight"
                        >
                            Proteção Radiológica, Física Médica e Ensino
                        </Typography>
                        <Typography
                            element="h2"
                            variant="secondary"
                            size="title3"
                            className="mt-6"
                        >
                            A Prophy oferece soluções personalizadas em física
                            médica para radiodiagnóstico e medicina nuclear,
                            garantindo a qualidade e segurança dos seus
                            procedimentos.
                        </Typography>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <ButtonLink href={authRedirect}>
                                Acesse a sua conta
                            </ButtonLink>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HomePage;
