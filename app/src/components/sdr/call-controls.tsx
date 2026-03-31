'use client'

import { Mic, MicOff, PhoneOff } from 'lucide-react'

interface CallControlsProps {
  onMute: () => void
  onHangup: () => void
  isMuted: boolean
  isActive: boolean
  duration: number // seconds
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function CallControls({
  onMute,
  onHangup,
  isMuted,
  isActive,
  duration,
}: CallControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Duration */}
      <span className="font-mono text-sm text-zinc-400 min-w-[48px]">
        {formatDuration(duration)}
      </span>

      {/* Mute */}
      <button
        onClick={onMute}
        disabled={!isActive}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          isMuted
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title={isMuted ? 'Desmutar' : 'Mutar'}
      >
        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
      </button>

      {/* Hangup */}
      <button
        onClick={onHangup}
        disabled={!isActive}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Desligar"
      >
        <PhoneOff size={16} />
      </button>
    </div>
  )
}
