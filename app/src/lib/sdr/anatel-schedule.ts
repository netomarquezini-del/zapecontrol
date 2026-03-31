/**
 * ANATEL compliance schedule checker
 * Allowed: Mon-Fri 8h-21h, Sat 8h-13h
 * Blocked: Sun, national holidays
 * Timezone: America/Sao_Paulo
 */

// Brazilian national holidays (fixed dates)
const FIXED_HOLIDAYS = [
  { month: 1, day: 1 },   // Confraternizacao Universal
  { month: 4, day: 21 },  // Tiradentes
  { month: 5, day: 1 },   // Dia do Trabalho
  { month: 9, day: 7 },   // Independencia
  { month: 10, day: 12 }, // Nossa Senhora Aparecida
  { month: 11, day: 2 },  // Finados
  { month: 11, day: 15 }, // Proclamacao da Republica
  { month: 12, day: 25 }, // Natal
]

const TZ = 'America/Sao_Paulo'

/**
 * Get current date parts in America/Sao_Paulo timezone.
 */
function getSaoPauloDate(date: Date = new Date()): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  dayOfWeek: number
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  })

  const parts = fmt.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ''

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
    dayOfWeek: weekdayMap[get('weekday')] ?? 0,
  }
}

/**
 * Create a Date object representing a specific time in Sao Paulo timezone.
 */
function createSaoPauloDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  // Build an ISO string and use trial-and-error to find exact UTC offset
  // Start with an estimate, then adjust
  const estimate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`)

  // Get what Sao Paulo thinks this UTC time is
  const spParts = getSaoPauloDate(estimate)

  // Calculate offset in ms and adjust
  const diffHours = hour - spParts.hour
  const diffMinutes = minute - spParts.minute
  const diffDays = day - spParts.day

  const adjusted = new Date(estimate.getTime() + (diffDays * 24 * 60 + diffHours * 60 + diffMinutes) * 60 * 1000)

  // Verify and make a second correction if needed (DST edge cases)
  const verify = getSaoPauloDate(adjusted)
  if (verify.hour !== hour || verify.day !== day) {
    const diffHours2 = hour - verify.hour
    const diffMinutes2 = minute - verify.minute
    const diffDays2 = day - verify.day
    return new Date(adjusted.getTime() + (diffDays2 * 24 * 60 + diffHours2 * 60 + diffMinutes2) * 60 * 1000)
  }

  return adjusted
}

/**
 * Compute Easter Sunday for a given year using the Anonymous Gregorian algorithm.
 */
function computeEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

/**
 * Compute Easter-based moveable holidays:
 * - Carnival (Carnaval): 47 days before Easter (Monday + Tuesday)
 * - Good Friday (Sexta-Feira Santa): 2 days before Easter
 * - Corpus Christi: 60 days after Easter
 */
export function computeEasterHolidays(year: number): Date[] {
  const easter = computeEasterSunday(year)
  const easterMs = easter.getTime()
  const DAY_MS = 24 * 60 * 60 * 1000

  const carnivalMonday = new Date(easterMs - 48 * DAY_MS)
  const carnivalTuesday = new Date(easterMs - 47 * DAY_MS)
  const goodFriday = new Date(easterMs - 2 * DAY_MS)
  const corpusChristi = new Date(easterMs + 60 * DAY_MS)

  return [carnivalMonday, carnivalTuesday, goodFriday, corpusChristi]
}

/**
 * Check if a given date (in Sao Paulo) is a Brazilian national holiday.
 */
function isHoliday(year: number, month: number, day: number): boolean {
  // Check fixed holidays
  for (const h of FIXED_HOLIDAYS) {
    if (h.month === month && h.day === day) return true
  }

  // Check moveable (Easter-based) holidays
  const easterHolidays = computeEasterHolidays(year)
  for (const h of easterHolidays) {
    if (h.getMonth() + 1 === month && h.getDate() === day) return true
  }

  return false
}

/**
 * Check if dialing is currently allowed according to ANATEL regulations.
 *
 * Rules:
 * - Mon-Fri: 8:00 - 21:00
 * - Saturday: 8:00 - 13:00
 * - Sunday: blocked
 * - National holidays: blocked
 */
export function isDialingAllowed(): { allowed: boolean; reason?: string; nextWindow?: Date } {
  const now = getSaoPauloDate()
  const { year, month, day, hour, minute, dayOfWeek } = now

  // Check holidays first
  if (isHoliday(year, month, day)) {
    return {
      allowed: false,
      reason: 'Hoje e feriado nacional. Ligacoes nao permitidas.',
      nextWindow: getNextDialWindow(),
    }
  }

  // Sunday
  if (dayOfWeek === 0) {
    return {
      allowed: false,
      reason: 'Ligacoes nao permitidas aos domingos.',
      nextWindow: getNextDialWindow(),
    }
  }

  // Saturday: 8h-13h
  if (dayOfWeek === 6) {
    if (hour < 8) {
      return {
        allowed: false,
        reason: 'Horario nao permitido. Sabados: 8h as 13h.',
        nextWindow: createSaoPauloDate(year, month, day, 8, 0),
      }
    }
    if (hour >= 13) {
      return {
        allowed: false,
        reason: 'Horario encerrado. Sabados: 8h as 13h.',
        nextWindow: getNextDialWindow(),
      }
    }
    return { allowed: true }
  }

  // Mon-Fri: 8h-21h
  if (hour < 8) {
    return {
      allowed: false,
      reason: 'Horario nao permitido. Seg-Sex: 8h as 21h.',
      nextWindow: createSaoPauloDate(year, month, day, 8, 0),
    }
  }

  if (hour >= 21) {
    return {
      allowed: false,
      reason: 'Horario encerrado. Seg-Sex: 8h as 21h.',
      nextWindow: getNextDialWindow(),
    }
  }

  // Within allowed window
  // Check remaining minutes to warn if close to end
  return { allowed: true }
}

/**
 * Returns the next Date when dialing is allowed.
 * Scans forward up to 10 days to handle long holiday stretches.
 */
export function getNextDialWindow(): Date {
  const now = getSaoPauloDate()
  let { year, month, day, dayOfWeek } = now

  // Start checking from tomorrow (or today if before 8h and today is valid)
  // If today is still valid and before opening, return today's opening
  if (!isHoliday(year, month, day) && dayOfWeek !== 0) {
    if (dayOfWeek === 6 && now.hour < 8) {
      return createSaoPauloDate(year, month, day, 8, 0)
    }
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && now.hour < 8) {
      return createSaoPauloDate(year, month, day, 8, 0)
    }
    // Saturday after 13h or weekday after 21h — move to next day
  }

  // Advance day by day
  for (let i = 1; i <= 10; i++) {
    const nextDate = new Date(year, month - 1, day + i)
    const ny = nextDate.getFullYear()
    const nm = nextDate.getMonth() + 1
    const nd = nextDate.getDate()
    const ndow = nextDate.getDay()

    if (ndow === 0) continue // Sunday
    if (isHoliday(ny, nm, nd)) continue // Holiday

    return createSaoPauloDate(ny, nm, nd, 8, 0)
  }

  // Fallback: next Monday at 8h
  const daysUntilMonday = ((1 - now.dayOfWeek + 7) % 7) || 7
  const fallback = new Date(year, month - 1, day + daysUntilMonday + 7)
  return createSaoPauloDate(fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate(), 8, 0)
}
