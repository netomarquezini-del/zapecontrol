import twilio from 'twilio'

let _client: ReturnType<typeof twilio> | null = null

/**
 * Get a configured Twilio REST client (singleton).
 * Uses TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN from env.
 */
export function getTwilioClient() {
  if (!_client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set')
    }
    _client = twilio(accountSid, authToken)
  }
  return _client
}

/**
 * Format a Brazilian phone number to E.164 (+55XXXXXXXXXXX).
 * Handles various input formats: raw digits, with country code, formatted, etc.
 */
export function formatPhoneBR(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  // Already has country code
  if (digits.length >= 12 && digits.startsWith('55')) {
    return `+${digits}`
  }

  // Local number (DDD + number) — 10 or 11 digits
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`
  }

  // If it already has +, just return
  if (phone.startsWith('+')) {
    return phone.replace(/[^\d+]/g, '')
  }

  // Fallback: prepend +55
  return `+55${digits}`
}
