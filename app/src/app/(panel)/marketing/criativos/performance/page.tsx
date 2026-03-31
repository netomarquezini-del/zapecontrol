'use client';

import dynamic from 'next/dynamic';

const PerformanceDashboard = dynamic(
  () =>
    import('../components/PerformanceDashboard').then(
      (m) => m.PerformanceDashboard
    ),
  { ssr: false }
);

export default function PerformancePage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <PerformanceDashboard />
    </div>
  );
}
