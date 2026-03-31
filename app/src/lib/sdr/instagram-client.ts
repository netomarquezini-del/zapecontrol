// Instagram DM client via Meta Graph API

const META_PAGE_ID = process.env.META_PAGE_ID || ''
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || ''
const META_GRAPH_API_VERSION = 'v21.0'
const META_GRAPH_API_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`

interface SendResult {
  success: boolean
  externalMessageId?: string
  error?: string
}

// Simple in-memory rate limiting queue
let lastSendTime = 0
const MIN_DELAY_MS = 1000 // 1 second between messages

async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastSendTime
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed))
  }
  lastSendTime = Date.now()
}

/**
 * Send an Instagram DM via Meta Graph API.
 * recipientId is the Instagram-scoped user ID (IGSID).
 */
export async function sendInstagramMessage(
  recipientId: string,
  content: string,
  mediaUrl?: string
): Promise<SendResult> {
  if (!META_PAGE_ID || !INSTAGRAM_ACCESS_TOKEN) {
    return { success: false, error: 'Instagram API not configured (missing META_PAGE_ID or INSTAGRAM_ACCESS_TOKEN)' }
  }

  await waitForRateLimit()

  try {
    const url = `${META_GRAPH_API_URL}/${META_PAGE_ID}/messages`

    const messagePayload: Record<string, unknown> = {
      recipient: { id: recipientId },
      access_token: INSTAGRAM_ACCESS_TOKEN,
    }

    if (mediaUrl) {
      messagePayload.message = {
        attachment: {
          type: 'image',
          payload: { url: mediaUrl },
        },
      }
      // If there's also text, send it as a separate call after
    } else {
      messagePayload.message = { text: content }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMsg = (errorData as Record<string, unknown>)?.error
        ? JSON.stringify((errorData as Record<string, unknown>).error)
        : `HTTP ${res.status}`
      return { success: false, error: `Instagram API error: ${errorMsg}` }
    }

    const data = await res.json()

    // If we sent media and there's also text content, send text as follow-up
    if (mediaUrl && content) {
      await waitForRateLimit()
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: content },
          access_token: INSTAGRAM_ACCESS_TOKEN,
        }),
      })
    }

    return {
      success: true,
      externalMessageId: data.message_id || undefined,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
