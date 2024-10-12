import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/../styles/globals.css";

import Provider from "@/redux/Provider";

import { NavBar, Footer } from "@/components/common";
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
                    <Setup />
                    <NavBar />
                    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-8">
                        {children}
                    </div>
                    <Footer />
                </Provider>
            </body>
        </html>
    );
}
