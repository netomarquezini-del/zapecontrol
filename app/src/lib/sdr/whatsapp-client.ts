// WhatsApp client - Evolution API with Twilio fallback

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'default'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || ''

interface SendResult {
  success: boolean
  externalMessageId?: string
  provider: 'evolution' | 'twilio'
  error?: string
}

/**
 * Send a WhatsApp text message via Evolution API, falling back to Twilio.
 */
export async function sendWhatsAppMessage(
  phone: string,
  content: string,
  mediaUrl?: string
): Promise<SendResult> {
  // Try Evolution API first
  if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
    try {
      const result = await sendViaEvolution(phone, content, mediaUrl)
      if (result.success) return result
    } catch (err) {
      console.warn('[whatsapp-client] Evolution API failed, trying Twilio fallback:', err)
    }
  }

  // Fallback to Twilio
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    return sendViaTwilio(phone, content, mediaUrl)
  }

  return { success: false, provider: 'evolution', error: 'No WhatsApp provider configured' }
}

/**
 * Send a rendered template message via WhatsApp.
 */
export async function sendWhatsAppTemplate(
  phone: string,
  templateContent: string
): Promise<SendResult> {
  return sendWhatsAppMessage(phone, templateContent)
}

async function sendViaEvolution(
  phone: string,
  content: string,
  mediaUrl?: string
): Promise<SendResult> {
  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '')

  if (mediaUrl) {
    const res = await fetch(`${baseUrl}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: normalizePhone(phone),
        mediatype: 'image',
        media: mediaUrl,
        caption: content,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Evolution sendMedia failed: ${res.status} - ${text}`)
    }

    const data = await res.json()
    return {
      success: true,
      externalMessageId: data.key?.id || data.messageId || undefined,
      provider: 'evolution',
    }
  }

  const res = await fetch(`${baseUrl}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: normalizePhone(phone),
      text: content,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Evolution sendText failed: ${res.status} - ${text}`)
  }

  const data = await res.json()
  return {
    success: true,
    externalMessageId: data.key?.id || data.messageId || undefined,
    provider: 'evolution',
  }
}

async function sendViaTwilio(
  phone: string,
  content: string,
  mediaUrl?: string
): Promise<SendResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const toNumber = `whatsapp:${normalizePhone(phone, true)}`
  const fromNumber = `whatsapp:${TWILIO_WHATSAPP_FROM}`

  const params = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Body: content,
  })

  if (mediaUrl) {
    params.append('MediaUrl', mediaUrl)
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    return { success: false, provider: 'twilio', error: `Twilio failed: ${res.status} - ${text}` }
  }

  const data = await res.json()
  return {
    success: true,
    externalMessageId: data.sid || undefined,
    provider: 'twilio',
  }
}

/**
 * Normalize phone to E.164-like format for API calls.
 */
function normalizePhone(phone: string, withPlus = false): string {
  const digits = phone.replace(/\D/g, '')
  const full = digits.startsWith('55') ? digits : `55${digits}`
  return withPlus ? `+${full}` : full
}
