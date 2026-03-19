import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZapeControl",
  description: "Painel de controle comercial da Zape",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.className} h-full antialiased`}>
      <body className="flex h-full bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
