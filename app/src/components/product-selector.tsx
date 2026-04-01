'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Package } from 'lucide-react'
import { getActiveProducts, type Product } from '@/lib/products'

export default function ProductSelector({ value, onChange }: {
  value: string
  onChange: (productId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const products = getActiveProducts()
  const selected = products.find(p => p.id === value) || products[0]

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[13px] font-bold text-white hover:border-lime-400/20 transition-all cursor-pointer"
      >
        <Package size={14} className="text-lime-400" />
        {selected.name}
        <ChevronDown size={12} className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl min-w-[220px] p-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 px-3 pb-2">Produto</p>
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange(p.id); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                value === p.id
                  ? 'bg-lime-400/8 text-lime-400 border border-lime-400/15'
                  : 'text-zinc-400 hover:text-lime-400 hover:bg-lime-400/5 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{p.name}</span>
                {p.ticket > 0 && <span className="text-[10px] text-zinc-600">R${p.ticket}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
