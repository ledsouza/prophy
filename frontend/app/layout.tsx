import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

import Provider from "@/redux/Provider";

import { NavBar, Footer } from "@/components/common";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Prophy",
    description: "Aplicação Web para gestão de prestação de serviços da Prophy",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                <Provider>
                    <NavBar />
                    {children}
                    <Footer />
                </Provider>
            </body>
        </html>
    );
}
