'use client';

import dynamic from 'next/dynamic';

const KanbanBoard = dynamic(
  () => import('../components/KanbanBoard').then((m) => m.KanbanBoard),
  { ssr: false }
);

export default function PipelinePage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <KanbanBoard />
    </div>
  );
}
