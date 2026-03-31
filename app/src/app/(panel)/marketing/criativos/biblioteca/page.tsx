'use client';

import dynamic from 'next/dynamic';

const Biblioteca = dynamic(
  () => import('../components/Biblioteca').then((m) => m.Biblioteca),
  { ssr: false }
);

export default function BibliotecaPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <Biblioteca />
    </div>
  );
}
