"use client";

import Link from "next/link";
import { useAppSelector } from "./redux/hooks";

const HomePage = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const authRedirect = isAuthenticated ? "/dashboard" : "/auth/login";

    return (
        <main className="bg-white">
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            Proteção Radiológica, Física Médica e Ensino
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            A Prophy oferece soluções personalizadas em física
                            médica para radiodiagnóstico e medicina nuclear,
                            garantindo a qualidade e segurança dos seus
                            procedimentos.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href={authRedirect}
                                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Acesse a sua conta
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HomePage;
