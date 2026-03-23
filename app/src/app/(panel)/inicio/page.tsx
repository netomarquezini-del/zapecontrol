'use client'

export default function InicioPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <img src="/logo-zape.svg" alt="Zape" className="h-16" />
      <div className="text-center">
        <span className="text-xl font-thin text-zinc-600">control</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-700 mt-2">
          Selecione um menu ao lado para comecar
        </p>
      </div>
    </div>
  )
}
