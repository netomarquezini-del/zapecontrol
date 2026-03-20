'use client'

import { Zap } from 'lucide-react'

export default function InicioPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400/10 border border-lime-400/20">
        <Zap size={28} className="text-lime-400" />
      </div>
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-black text-white tracking-tight">ZAPE</span>
          <span className="text-xl font-thin text-zinc-600">control</span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-700 mt-2">
          Selecione um menu ao lado para comecar
        </p>
      </div>
    </div>
  )
}
