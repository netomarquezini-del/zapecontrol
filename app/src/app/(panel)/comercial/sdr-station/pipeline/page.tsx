'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Kanban, Loader2, Phone, Building2, Tag, GripVertical } from 'lucide-react'
import { PIPELINE_STATUSES } from '@/lib/types-sdr'
import type { SdrLead, SdrLeadStatus } from '@/lib/types-sdr'

export default function SdrPipelinePage() {
  const [leads, setLeads] = useState<SdrLead[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<SdrLeadStatus | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const dragCounter = useRef<Record<string, number>>({})

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all leads (no pagination, we need all for kanban)
      const res = await fetch('/api/sdr/leads?limit=100')
      const data = await res.json()
      if (res.ok) {
        setLeads(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Group leads by status
  const grouped: Record<SdrLeadStatus, SdrLead[]> = {
    novo: [],
    tentativa: [],
    conectado: [],
    qualificado: [],
    agendado: [],
    descartado: [],
  }

  for (const lead of leads) {
    if (grouped[lead.status]) {
      grouped[lead.status].push(lead)
    }
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', leadId)
    // Make drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggingId(null)
    setDragOverColumn(null)
    dragCounter.current = {}
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragEnter = (e: React.DragEvent, status: SdrLeadStatus) => {
    e.preventDefault()
    dragCounter.current[status] = (dragCounter.current[status] || 0) + 1
    setDragOverColumn(status)
  }

  const handleDragLeave = (_e: React.DragEvent, status: SdrLeadStatus) => {
    dragCounter.current[status] = (dragCounter.current[status] || 0) - 1
    if (dragCounter.current[status] <= 0) {
      dragCounter.current[status] = 0
      if (dragOverColumn === status) {
        setDragOverColumn(null)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: SdrLeadStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    dragCounter.current = {}

    const leadId = e.dataTransfer.getData('text/plain')
    if (!leadId) return

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )
    setUpdatingId(leadId)

    try {
      const res = await fetch(`/api/sdr/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        // Revert on error
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l))
        )
      }
    } catch {
      // Revert on error
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l))
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
          <Kanban size={20} className="text-lime-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Pipeline</h1>
          <p className="text-xs text-zinc-500">{leads.length} lead{leads.length !== 1 ? 's' : ''} no pipeline</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STATUSES.map((statusCfg) => {
            const columnLeads = grouped[statusCfg.value] || []
            const isOver = dragOverColumn === statusCfg.value

            return (
              <div
                key={statusCfg.value}
                className={`flex flex-col shrink-0 w-72 rounded-2xl border bg-[#111111] transition-colors ${
                  isOver
                    ? 'border-lime-400/40 bg-[#111a11]'
                    : 'border-[#222222]'
                }`}
                onDragEnter={(e) => handleDragEnter(e, statusCfg.value)}
                onDragLeave={(e) => handleDragLeave(e, statusCfg.value)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, statusCfg.value)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: statusCfg.color }}
                    />
                    <span className="text-sm font-semibold text-white">{statusCfg.label}</span>
                  </div>
                  <span
                    className="inline-flex items-center justify-center min-w-[24px] rounded-full px-1.5 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: statusCfg.color + '22', color: statusCfg.color }}
                  >
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[calc(100vh-220px)]">
                  {columnLeads.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-xs text-zinc-600">Sem leads</p>
                    </div>
                  )}

                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      className={`group rounded-xl border bg-[#0a0a0a] p-3 cursor-grab active:cursor-grabbing transition-all hover:border-[#333333] ${
                        draggingId === lead.id ? 'opacity-50 scale-95' : ''
                      } ${updatingId === lead.id ? 'animate-pulse' : ''} border-[#1a1a1a]`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium text-white leading-tight truncate">
                          {lead.nome}
                        </h4>
                        <GripVertical
                          size={14}
                          className="text-zinc-700 group-hover:text-zinc-500 shrink-0 mt-0.5"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-zinc-600 shrink-0" />
                          <span className="text-xs text-zinc-500 truncate">{lead.telefone}</span>
                        </div>

                        {lead.empresa && (
                          <div className="flex items-center gap-2">
                            <Building2 size={12} className="text-zinc-600 shrink-0" />
                            <span className="text-xs text-zinc-500 truncate">{lead.empresa}</span>
                          </div>
                        )}

                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Tag size={10} className="text-zinc-600 shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {lead.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-[#1a1a1a] border border-[#222222] px-1.5 py-0.5 text-[10px] text-zinc-500"
                                >
                                  {tag}
                                </span>
                              ))}
                              {lead.tags.length > 2 && (
                                <span className="text-[10px] text-zinc-600">+{lead.tags.length - 2}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
