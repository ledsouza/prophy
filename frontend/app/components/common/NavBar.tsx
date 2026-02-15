"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { useLogoutMutation, useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { logout as setLogout } from "@/redux/features/authSlice";
import Role from "@/enums/Role";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";

import { NavLink } from "@/components/common";

export default function Navbar() {
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const [logout] = useLogoutMutation();
    const { data: userData } = useRetrieveUserQuery();

    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        logout()
            .unwrap()
            .then(() => {
                dispatch(setLogout());
            });
    };

    const normalizePathname = (path: string) => {
        if (path === "/") {
            return path;
        }

        return path.endsWith("/") ? path.slice(0, -1) : path;
    };

    const isSelected = (path: string) => {
        return normalizePathname(pathname) === normalizePathname(path);
    };

    const authLinks = (isMobile: boolean) => (
        <>
            <NavLink
                isSelected={isSelected("/dashboard/")}
                isMobile={isMobile}
                variant={isMobile ? "light" : undefined}
                href="/dashboard"
                dataTestId="dashboard-nav"
            >
                Painel de Gerenciamento
            </NavLink>
            <NavLink
                isSelected={isSelected("/dashboard/materials/")}
                isMobile={isMobile}
                variant={isMobile ? "light" : undefined}
                href="/dashboard/materials/"
                dataTestId="materials-dashboard-nav"
            >
                Materiais Institucionais
            </NavLink>

            {(userData?.role === Role.GP || userData?.role === Role.C) && (
                <NavLink
                    isSelected={isSelected("/dashboard/users/")}
                    isMobile={isMobile}
                    variant={isMobile ? "light" : undefined}
                    href="/dashboard/users/"
                    dataCy="gp-users-nav"
                >
                    Usuários
                </NavLink>
            )}
            <NavLink
                isMobile={isMobile}
                variant={isMobile ? "light" : undefined}
                onClick={handleLogout}
                dataTestId="logout-btn"
                dataCy="logout-btn"
            >
                Sair
            </NavLink>
        </>
    );

    const guestLinks = (isMobile: boolean, variant?: "dark" | "light") => (
        <>
            <NavLink
                isSelected={isSelected("/auth/login/")}
                isMobile={isMobile}
                variant={isMobile ? "light" : variant}
                href="/auth/login"
            >
                Acessar a sua conta
            </NavLink>
            <NavLink
                isSelected={isSelected("/auth/register/")}
                isMobile={isMobile}
                variant={isMobile ? "light" : variant}
                href="/auth/register"
            >
                Cadastrar a sua instituição
            </NavLink>
        </>
    );

    return (
        <Disclosure as="nav" className="bg-light border-b border-gray-tertiary/40">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                        <div className="relative flex h-16 items-center">
                            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                                <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-primary hover:bg-quaternary/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-tertiary">
                                    <span className="sr-only">Abrir menu principal</span>
                                    {open ? (
                                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </DisclosureButton>
                            </div>
                            <div className="flex w-full items-center justify-between">
                                <div className="flex items-center gap-3 pl-12 sm:pl-0">
                                    <Link
                                        href="/"
                                        aria-label="Prophy"
                                        className="flex items-center"
                                    >
                                        <Image
                                            src="/images/prophy-big-logo.avif"
                                            alt="Prophy"
                                            width={160}
                                            height={40}
                                            priority
                                            className="h-10 w-auto"
                                        />
                                    </Link>
                                </div>

                                <div className="hidden sm:block absolute left-1/2 -translate-x-1/2">
                                    <div className="flex items-center gap-2">
                                        {isAuthenticated ? (
                                            <>
                                                <NavLink
                                                    isSelected={isSelected("/dashboard/")}
                                                    variant="light"
                                                    href="/dashboard"
                                                    dataTestId="dashboard-nav"
                                                >
                                                    Painel de Gerenciamento
                                                </NavLink>
                                                <NavLink
                                                    isSelected={isSelected("/dashboard/materials/")}
                                                    variant="light"
                                                    href="/dashboard/materials/"
                                                    dataTestId="materials-dashboard-nav"
                                                >
                                                    Materiais Institucionais
                                                </NavLink>

                                                {(userData?.role === Role.GP ||
                                                    userData?.role === Role.C) && (
                                                    <NavLink
                                                        isSelected={isSelected("/dashboard/users/")}
                                                        variant="light"
                                                        href="/dashboard/users/"
                                                        dataCy="gp-users-nav"
                                                    >
                                                        Usuários
                                                    </NavLink>
                                                )}
                                            </>
                                        ) : (
                                            guestLinks(false, "light")
                                        )}
                                    </div>
                                </div>

                                <div className="hidden sm:flex items-center">
                                    {isAuthenticated && (
                                        <NavLink
                                            variant="light"
                                            onClick={handleLogout}
                                            dataTestId="logout-btn"
                                            dataCy="logout-btn"
                                        >
                                            Sair
                                        </NavLink>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DisclosurePanel className="sm:hidden">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            {isAuthenticated ? authLinks(true) : guestLinks(true)}
                        </div>
                    </DisclosurePanel>
                </>
            )}
        </Disclosure>
    );
}
