'use client'

import { useState, useEffect } from 'react'
import type { RoleTemplate } from '@/lib/permissions'

interface RoleTemplateSelectorProps {
  value: string | null
  onChange: (templateId: string | null, permissions: string[]) => void
  disabled?: boolean
}

export default function RoleTemplateSelector({ value, onChange, disabled }: RoleTemplateSelectorProps) {
  const [templates, setTemplates] = useState<RoleTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/role-templates')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (templateId: string) => {
    if (templateId === '') {
      onChange(null, [])
      return
    }
    const tmpl = templates.find((t) => t.id === templateId)
    if (tmpl) {
      onChange(tmpl.id, tmpl.permissions)
    }
  }

  const selectCls = "w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[13px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors cursor-pointer"

  if (loading) {
    return (
      <select disabled className={`${selectCls} opacity-40`}>
        <option>Carregando perfis...</option>
      </select>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled}
      className={`${selectCls} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <option value="">Personalizado (sem perfil)</option>
      {templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label} {t.description ? `— ${t.description}` : ''}
        </option>
      ))}
    </select>
  )
}
