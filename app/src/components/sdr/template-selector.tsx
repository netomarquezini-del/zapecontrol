'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, ChevronDown, X, Eye } from 'lucide-react'
import type { SdrMessageChannel, SdrMessageTemplate } from '@/lib/types-sdr'

interface TemplateSelectorProps {
  channel: SdrMessageChannel
  onSelect: (content: string) => void
  leadData?: {
    nome?: string
    empresa?: string
    telefone?: string
    email?: string
    [key: string]: string | undefined
  }
}

export default function TemplateSelector({
  channel,
  onSelect,
  leadData,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<SdrMessageTemplate[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<SdrMessageTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setPreviewTemplate(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sdr/templates?channel=${channel}`)
      const json = await res.json()
      setTemplates(json.data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  function renderContent(content: string): string {
    let rendered = content
    if (leadData) {
      for (const [key, value] of Object.entries(leadData)) {
        if (value) {
          rendered = rendered.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'gi'),
            value
          )
        }
      }
    }
    return rendered
  }

  function handleSelect(template: SdrMessageTemplate) {
    const rendered = renderContent(template.content)
    onSelect(rendered)
    setIsOpen(false)
    setPreviewTemplate(null)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-lime-400 hover:bg-lime-400/5 border border-[#222222] hover:border-lime-400/20 transition-all"
        title="Templates"
      >
        <FileText size={14} />
        <span className="hidden sm:inline">Templates</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-80 max-h-96 rounded-xl border border-[#222222] bg-[#111111] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#222222]">
            <span className="text-xs font-semibold text-zinc-300">
              Templates ({channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'})
            </span>
            <button
              onClick={() => { setIsOpen(false); setPreviewTemplate(null) }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          </div>

          {loading ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-500">
              Carregando templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-500">
              Nenhum template para este canal
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="group border-b border-[#1a1a1a] last:border-0"
                >
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-white/[0.02]">
                    <button
                      onClick={() => handleSelect(tmpl)}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm font-medium text-zinc-300 group-hover:text-white">
                        {tmpl.name}
                      </div>
                      <div className="text-xs text-zinc-600 truncate mt-0.5">
                        {tmpl.content.substring(0, 60)}...
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setPreviewTemplate(previewTemplate?.id === tmpl.id ? null : tmpl)
                      }
                      className="ml-2 p-1 text-zinc-600 hover:text-lime-400 shrink-0"
                      title="Visualizar"
                    >
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* Preview panel */}
                  {previewTemplate?.id === tmpl.id && (
                    <div className="px-3 pb-3">
                      <div className="rounded-lg bg-[#0a0a0a] border border-[#222222] p-3">
                        <div className="text-xs font-medium text-zinc-500 mb-1.5">
                          Preview (com dados do lead):
                        </div>
                        <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {renderContent(tmpl.content)}
                        </div>
                        {tmpl.variables && tmpl.variables.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tmpl.variables.map((v) => (
                              <span
                                key={v}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20"
                              >
                                {`{{${v}}}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSelect(tmpl)}
                        className="mt-2 w-full text-xs font-medium py-1.5 rounded-lg bg-lime-400 text-black hover:bg-lime-300 transition-colors"
                      >
                        Usar este template
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
