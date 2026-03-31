'use client';

import dynamic from 'next/dynamic';

const MatrizCobertura = dynamic(
  () => import('../components/MatrizCobertura').then((m) => m.MatrizCobertura),
  { ssr: false }
);

export default function MatrizPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <MatrizCobertura />
    </div>
  );
}
