'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  Loader2,
  Image as ImageIcon,
  Mic,
  User,
  Instagram,
  Phone,
} from 'lucide-react'
import type {
  SdrLead,
  SdrMessage,
  SdrMessageChannel,
} from '@/lib/types-sdr'
import TemplateSelector from './template-selector'

// ══════════════════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════════════════

type ChannelFilter = 'todos' | SdrMessageChannel

interface ConversationPreview {
  lead: SdrLead
  lastMessage: SdrMessage | null
  unreadCount: number
  channels: SdrMessageChannel[]
}

// ══════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) {
    return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ChannelIcon({ channel, size = 14 }: { channel: SdrMessageChannel; size?: number }) {
  switch (channel) {
    case 'whatsapp':
      return <MessageSquare size={size} className="text-emerald-400" />
    case 'instagram':
      return <Instagram size={size} className="text-pink-400" />
    case 'phone':
      return <Phone size={size} className="text-blue-400" />
    default:
      return <MessageSquare size={size} className="text-zinc-500" />
  }
}

function StatusIcon({ status }: { status: SdrMessage['status'] }) {
  switch (status) {
    case 'pending':
      return <Loader2 size={12} className="animate-spin text-zinc-500" />
    case 'sent':
      return <Check size={12} className="text-zinc-500" />
    case 'delivered':
      return <CheckCheck size={12} className="text-zinc-500" />
    case 'read':
      return <CheckCheck size={12} className="text-blue-400" />
    case 'failed':
      return <span className="text-[10px] text-red-400">!</span>
    default:
      return null
  }
}

// ══════════════════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════════════════

export default function MultichannelInbox() {
  // State
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [selectedLead, setSelectedLead] = useState<SdrLead | null>(null)
  const [messages, setMessages] = useState<SdrMessage[]>([])
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('todos')
  const [chatChannelFilter, setChatChannelFilter] = useState<ChannelFilter>('todos')
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendChannel, setSendChannel] = useState<'whatsapp' | 'instagram'>('whatsapp')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ────────────────────────────────────────
  //  Fetch conversations (leads with messages)
  // ────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/sdr/leads?limit=100')
      const json = await res.json()
      const leads: SdrLead[] = json.data || []

      // For each lead, get latest message (we batch this efficiently)
      const previews: ConversationPreview[] = []
      for (const lead of leads) {
        if (lead.total_messages === 0) continue

        const msgRes = await fetch(`/api/sdr/messages?lead_id=${lead.id}&limit=1`)
        const msgJson = await msgRes.json()
        const lastMsg: SdrMessage | null = msgJson.data?.[0] || null

        // Determine channels used by this lead
        const channels: SdrMessageChannel[] = []
        if (lead.telefone) channels.push('whatsapp')
        const cf = (lead.custom_fields || {}) as Record<string, string>
        if (cf.instagram_id || cf.instagram_username) channels.push('instagram')

        previews.push({
          lead,
          lastMessage: lastMsg,
          unreadCount: 0, // TODO: compute from unread inbound messages
          channels,
        })
      }

      // Also include leads with no messages but who have phone/instagram
      for (const lead of leads) {
        if (lead.total_messages > 0) continue
        const cf = (lead.custom_fields || {}) as Record<string, string>
        const hasChannels = lead.telefone || cf.instagram_id || cf.instagram_username
        if (!hasChannels) continue

        const channels: SdrMessageChannel[] = []
        if (lead.telefone) channels.push('whatsapp')
        if (cf.instagram_id || cf.instagram_username) channels.push('instagram')

        previews.push({
          lead,
          lastMessage: null,
          unreadCount: 0,
          channels,
        })
      }

      // Sort: leads with most recent messages first
      previews.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.lead.created_at
        const bTime = b.lastMessage?.created_at || b.lead.created_at
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      setConversations(previews)
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  // ────────────────────────────────────────
  //  Fetch messages for selected lead
  // ────────────────────────────────────────

  const fetchMessages = useCallback(async (leadId: string) => {
    setLoadingMessages(true)
    try {
      let url = `/api/sdr/messages?lead_id=${leadId}&limit=100`
      if (chatChannelFilter !== 'todos') {
        url += `&channel=${chatChannelFilter}`
      }
      const res = await fetch(url)
      const json = await res.json()
      const msgs: SdrMessage[] = (json.data || []).reverse() // oldest first
      setMessages(msgs)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [chatChannelFilter])

  // ────────────────────────────────────────
  //  Effects
  // ────────────────────────────────────────

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Load messages when lead changes
  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id)
    } else {
      setMessages([])
    }
  }, [selectedLead, fetchMessages])

  // Polling for new messages
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    if (selectedLead) {
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedLead.id)
      }, 5000)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [selectedLead, fetchMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ────────────────────────────────────────
  //  Send message
  // ────────────────────────────────────────

  async function handleSend() {
    if (!inputText.trim() || !selectedLead || sending) return

    setSending(true)
    try {
      const endpoint = sendChannel === 'whatsapp'
        ? '/api/sdr/whatsapp/send'
        : '/api/sdr/instagram/send'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          content: inputText.trim(),
        }),
      })

      if (res.ok) {
        setInputText('')
        // Refresh messages
        await fetchMessages(selectedLead.id)
        // Also refresh conversation list for preview update
        fetchConversations()
      } else {
        const err = await res.json()
        console.error('Send error:', err)
      }
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTemplateSelect(content: string) {
    setInputText(content)
    inputRef.current?.focus()
  }

  // ────────────────────────────────────────
  //  Filter conversations
  // ────────────────────────────────────────

  const filteredConversations = conversations.filter((conv) => {
    // Channel filter
    if (channelFilter !== 'todos' && !conv.channels.includes(channelFilter)) {
      return false
    }
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const nameMatch = conv.lead.nome?.toLowerCase().includes(q)
      const phoneMatch = conv.lead.telefone?.toLowerCase().includes(q)
      const msgMatch = conv.lastMessage?.content?.toLowerCase().includes(q)
      if (!nameMatch && !phoneMatch && !msgMatch) return false
    }
    return true
  })

  // ══════════════════════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
      {/* ═══ LEFT PANEL: Conversation List ═══ */}
      <div className="w-80 flex-shrink-0 border-r border-[#222222] flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-[#222222]">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#0a0a0a] border border-[#222222] rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/30"
            />
          </div>
        </div>

        {/* Channel filter tabs */}
        <div className="flex border-b border-[#222222]">
          {(['todos', 'whatsapp', 'instagram'] as ChannelFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setChannelFilter(filter)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                channelFilter === filter
                  ? 'text-lime-400 border-b-2 border-lime-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {filter === 'todos' ? 'Todos' : filter === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare size={24} className="mx-auto text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-600">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.lead.id}
                onClick={() => {
                  setSelectedLead(conv.lead)
                  // Auto-set send channel based on lead's available channels
                  if (conv.channels.includes('whatsapp')) {
                    setSendChannel('whatsapp')
                  } else if (conv.channels.includes('instagram')) {
                    setSendChannel('instagram')
                  }
                }}
                className={`w-full text-left px-3 py-3 border-b border-[#1a1a1a] transition-colors ${
                  selectedLead?.id === conv.lead.id
                    ? 'bg-lime-400/5 border-l-2 border-l-lime-400'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-[#1a1a1a] border border-[#222222] flex items-center justify-center shrink-0">
                    <User size={16} className="text-zinc-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-zinc-200 truncate">
                        {conv.lead.nome}
                      </span>
                      <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                        {formatTime(conv.lastMessage?.created_at || conv.lead.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Channel icons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {conv.channels.map((ch) => (
                          <ChannelIcon key={ch} channel={ch} size={11} />
                        ))}
                      </div>

                      {/* Last message preview */}
                      <span className="text-xs text-zinc-600 truncate">
                        {conv.lastMessage
                          ? (conv.lastMessage.direction === 'outbound' ? 'Voce: ' : '') +
                            conv.lastMessage.content.substring(0, 40)
                          : 'Sem mensagens'}
                      </span>
                    </div>
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div className="h-5 min-w-5 rounded-full bg-lime-400 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-black px-1">
                        {conv.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Chat ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedLead ? (
          // Empty state
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#1a1a1a] border border-[#222222] flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-zinc-700" />
              </div>
              <h3 className="text-sm font-medium text-zinc-400 mb-1">
                Selecione uma conversa
              </h3>
              <p className="text-xs text-zinc-600">
                Escolha um lead para iniciar ou continuar uma conversa
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#1a1a1a] border border-[#222222] flex items-center justify-center">
                  <User size={16} className="text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {selectedLead.nome}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {selectedLead.empresa && <span>{selectedLead.empresa}</span>}
                    {selectedLead.telefone && <span>{selectedLead.telefone}</span>}
                  </div>
                </div>
              </div>

              {/* Chat channel filter */}
              <div className="flex items-center gap-1 bg-[#0a0a0a] rounded-lg border border-[#222222] p-0.5">
                {(['todos', 'whatsapp', 'instagram'] as ChannelFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setChatChannelFilter(filter)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      chatChannelFilter === filter
                        ? 'bg-[#222222] text-white'
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {filter === 'todos' ? 'Todos' : filter === 'whatsapp' ? 'WA' : 'IG'}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-zinc-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-xs text-zinc-600">Nenhuma mensagem ainda. Envie a primeira!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound'
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 ${
                          isOutbound
                            ? 'bg-lime-400/15 border border-lime-400/20 rounded-br-md'
                            : 'bg-[#1a1a1a] border border-[#222222] rounded-bl-md'
                        }`}
                      >
                        {/* Channel badge for mixed view */}
                        {chatChannelFilter === 'todos' && (
                          <div className="flex items-center gap-1 mb-1">
                            <ChannelIcon channel={msg.channel} size={10} />
                            <span className="text-[10px] text-zinc-600">
                              {msg.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                            </span>
                          </div>
                        )}

                        {/* Message content */}
                        <p
                          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isOutbound ? 'text-zinc-200' : 'text-zinc-300'
                          }`}
                        >
                          {msg.content}
                        </p>

                        {/* Footer: time + status */}
                        <div
                          className={`flex items-center gap-1.5 mt-1 ${
                            isOutbound ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="text-[10px] text-zinc-600">
                            {formatTimestamp(msg.sent_at || msg.created_at)}
                          </span>
                          {isOutbound && <StatusIcon status={msg.status} />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-[#222222] p-3">
              {/* Send channel selector */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Enviar via:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSendChannel('whatsapp')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      sendChannel === 'whatsapp'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : 'text-zinc-600 border border-transparent hover:text-zinc-400'
                    }`}
                  >
                    <MessageSquare size={10} />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setSendChannel('instagram')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      sendChannel === 'instagram'
                        ? 'bg-pink-400/10 text-pink-400 border border-pink-400/20'
                        : 'text-zinc-600 border border-transparent hover:text-zinc-400'
                    }`}
                  >
                    <Instagram size={10} />
                    Instagram
                  </button>
                </div>
              </div>

              <div className="flex items-end gap-2">
                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0 pb-1">
                  <TemplateSelector
                    channel={sendChannel}
                    onSelect={handleTemplateSelect}
                    leadData={{
                      nome: selectedLead.nome,
                      empresa: selectedLead.empresa || undefined,
                      telefone: selectedLead.telefone,
                      email: selectedLead.email || undefined,
                    }}
                  />

                  {sendChannel === 'instagram' && (
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:text-pink-400 hover:bg-pink-400/5 border border-[#222222] hover:border-pink-400/20 transition-all"
                      title="Enviar imagem"
                    >
                      <ImageIcon size={14} />
                    </button>
                  )}

                  {sendChannel === 'whatsapp' && (
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/5 border border-[#222222] hover:border-emerald-400/20 transition-all"
                      title="Gravar audio"
                    >
                      <Mic size={14} />
                    </button>
                  )}
                </div>

                {/* Text input */}
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem..."
                  rows={1}
                  className="flex-1 resize-none bg-[#0a0a0a] border border-[#222222] rounded-xl px-3.5 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/30 max-h-32 leading-relaxed"
                  style={{ minHeight: '40px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                  }}
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="shrink-0 h-10 w-10 rounded-xl bg-lime-400 hover:bg-lime-300 disabled:bg-[#222222] disabled:text-zinc-600 text-black flex items-center justify-center transition-all"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
