import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/../styles/globals.css";

import Provider from "@/redux/Provider";

import { Footer, NavBar } from "@/components/common";
import { Setup } from "./components/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Prophy",
    description: "Aplicação Web para gestão de prestação de serviços da Prophy",
    icons: {
        icon: "/favicon.ico",
        apple: "/apple-icon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={`${inter.className} bg-light`}>
                <Provider>
                    <div className="flex min-h-screen flex-col">
                        <Setup />
                        <NavBar />
                        <main
                            data-cy="app-shell"
                            className={
                                "mx-auto w-full max-w-7xl flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-4"
                            }
                        >
                            {children}
                        </main>
                        <Footer />
                    </div>
                </Provider>
            </body>
        </html>
    );
}
