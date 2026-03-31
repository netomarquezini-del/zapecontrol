'use client';

import dynamic from 'next/dynamic';

const InteligenciaDashboard = dynamic(
  () =>
    import('../components/InteligenciaDashboard').then(
      (m) => m.InteligenciaDashboard
    ),
  { ssr: false }
);

export default function InteligenciaPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <InteligenciaDashboard />
    </div>
  );
}
