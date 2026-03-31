'use client'

import { MessageSquare } from 'lucide-react'
import MultichannelInbox from '@/components/sdr/multichannel-inbox'

export default function InboxPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
            <MessageSquare size={20} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Inbox
            </h1>
            <p className="text-sm text-zinc-500">
              Central de mensagens - WhatsApp e Instagram Direct
            </p>
          </div>
        </div>
      </div>

      {/* Inbox */}
      <MultichannelInbox />
    </div>
  )
}
