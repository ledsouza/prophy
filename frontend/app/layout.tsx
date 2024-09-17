import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/../styles/globals.css";

import Provider from "@/redux/Provider";

import { NavBar, Footer } from "@/components/common";
import { Setup } from "./components/utils";
import Head from "next/head";

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
            <Head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
            </Head>
            <body className={inter.className}>
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
