import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestao de Criativos — ZapeControl',
  description: 'Painel de Gestao de Criativos — Zape Ecomm',
};

export default function CriativosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
