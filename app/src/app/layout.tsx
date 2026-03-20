import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";

const albertSans = Albert_Sans({
  subsets: ["latin"],
  weight: ["100", "400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ZapeControl",
  description: "Painel de controle comercial da Zape",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${albertSans.className} h-full antialiased`}>
      <body className="h-full bg-black text-white">
        {children}
      </body>
    </html>
  );
}
