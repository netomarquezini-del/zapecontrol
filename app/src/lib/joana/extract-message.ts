/**
 * Joana CS Monitor — Message Extraction from Z-API Group Webhooks
 */

export interface GroupMessage {
  groupId: string
  groupName: string
  senderPhone: string
  senderName: string
  content: string
  messageType: string
  messageId: string | null
  timestamp: string
  mediaUrl: string | null
  isTeamMember: boolean
}

export function isTeamMember(name: string | undefined | null): boolean {
  return !!name && /zape/i.test(name)
}

export function extractGroupMessage(data: Record<string, any>): GroupMessage | null {
  // Only process group messages
  const isGroup = data.isGroup === true ||
    (data.chatId && data.chatId.includes('@g.us')) ||
    (data.phone && data.phone.includes('@g.us'))

  if (!isGroup) return null

  // Extract group ID
  const groupId = data.chatId || data.phone || data.chat?.id
  if (!groupId) return null

  // Extract group name
  const groupName = data.chatName || data.chat?.name || data.senderName || groupId

  // Extract sender info (participant in group)
  const senderPhone = (data.participantPhone || data.participant || data.senderPhone || '')
    .replace(/\D/g, '')
  const senderName = data.senderName || data.participantName || data.pushName || data.contact?.name || ''

  // Extract message content (multi-format Z-API support)
  let content = ''
  const messageType = data.type || 'text'

  if (data.body && typeof data.body === 'object') {
    content = data.body.message || data.body.text || ''
  } else if (data.text && typeof data.text === 'object') {
    content = data.text.message || ''
  } else if (typeof data.body === 'string') {
    content = data.body
  } else if (data.message) {
    if (typeof data.message === 'string') {
      content = data.message
    } else if (typeof data.message === 'object') {
      content = data.message.body || data.message.text || data.message.conversation || ''
    }
  } else if (data.text) {
    if (typeof data.text === 'string') {
      try {
        const parsed = JSON.parse(data.text)
        content = parsed.message || parsed.text || data.text
      } catch {
        content = data.text
      }
    }
  }

  // Extract message ID for dedup
  const messageId = data.messageId || data.id?.id || data.ids?.[0]?.id || null

  // Extract timestamp
  let timestamp: string
  if (data.momment) {
    timestamp = new Date(data.momment).toISOString()
  } else if (data.timestamp) {
    const ts = data.timestamp > 1e12 ? data.timestamp : data.timestamp * 1000
    timestamp = new Date(ts).toISOString()
  } else {
    timestamp = new Date().toISOString()
  }

  // Media URL for non-text messages
  const mediaUrl = data.image?.imageUrl || data.video?.videoUrl ||
    data.audio?.audioUrl || data.document?.documentUrl || null

  // For media messages, use caption or type description
  if (!content && mediaUrl) {
    content = data.image?.caption || data.video?.caption || `[${messageType}]`
  }

  // Skip if no content and no media
  if (!content && !mediaUrl) return null

  return {
    groupId,
    groupName,
    senderPhone,
    senderName,
    content,
    messageType,
    messageId,
    timestamp,
    mediaUrl,
    isTeamMember: isTeamMember(senderName)
  }
}
