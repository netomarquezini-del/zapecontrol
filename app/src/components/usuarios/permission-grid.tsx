'use client'

import { PERMISSION_GROUPS } from '@/lib/permissions'

interface PermissionGridProps {
  selected: string[]
  onChange: (perms: string[]) => void
  disabled?: boolean
}

export default function PermissionGrid({ selected, onChange, disabled }: PermissionGridProps) {
  const toggle = (id: string) => {
    if (disabled) return
    onChange(
      selected.includes(id)
        ? selected.filter((p) => p !== id)
        : [...selected, id]
    )
  }

  const toggleGroup = (groupId: string) => {
    if (disabled) return
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId)
    if (!group) return
    const groupIds = group.items.map((i) => i.id)
    const allSelected = groupIds.every((id) => selected.includes(id))
    if (allSelected) {
      onChange(selected.filter((p) => !groupIds.includes(p)))
    } else {
      onChange([...new Set([...selected, ...groupIds])])
    }
  }

  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map((group) => {
        const groupIds = group.items.map((i) => i.id)
        const selectedCount = groupIds.filter((id) => selected.includes(id)).length
        const allSelected = selectedCount === groupIds.length

        return (
          <div key={group.id} className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                {group.label}
              </span>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                disabled={disabled}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                  allSelected
                    ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                    : 'bg-[#111111] text-zinc-600 border border-[#222222] hover:text-zinc-400'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {allSelected ? 'Remover todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const isActive = selected.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    disabled={disabled}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                        : 'bg-[#111111] text-zinc-600 border border-[#222222] hover:text-zinc-400'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
            {selectedCount > 0 && selectedCount < groupIds.length && (
              <div className="mt-2">
                <div className="h-1 rounded-full bg-[#222222] overflow-hidden">
                  <div
                    className="h-full bg-lime-400/30 rounded-full transition-all"
                    style={{ width: `${(selectedCount / groupIds.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
