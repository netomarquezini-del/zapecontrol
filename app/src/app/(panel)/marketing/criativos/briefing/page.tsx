'use client';

import dynamic from 'next/dynamic';

const BriefingBuilder = dynamic(
  () => import('../components/BriefingBuilder').then((m) => m.BriefingBuilder),
  { ssr: false }
);

export default function BriefingPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <BriefingBuilder />
    </div>
  );
}
