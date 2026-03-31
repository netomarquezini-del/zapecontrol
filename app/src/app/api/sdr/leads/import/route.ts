import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface CsvRow {
  [key: string]: string
}

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = parseCsvLine(lines[0])
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: CsvRow = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',' || char === ';') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current.trim())
  return result
}

const VALID_FIELDS = ['nome', 'telefone', 'email', 'empresa', 'cargo', 'origem'] as const

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mappingRaw = formData.get('mapping') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo CSV nao enviado' }, { status: 400 })
    }

    if (!mappingRaw) {
      return NextResponse.json({ error: 'Mapeamento de colunas nao enviado' }, { status: 400 })
    }

    let mapping: Record<string, string>
    try {
      mapping = JSON.parse(mappingRaw)
    } catch {
      return NextResponse.json({ error: 'Mapeamento de colunas invalido' }, { status: 400 })
    }

    // Validate mapping has at least nome and telefone
    const reverseMapping: Record<string, string> = {}
    for (const [csvCol, leadField] of Object.entries(mapping)) {
      if (leadField && VALID_FIELDS.includes(leadField as typeof VALID_FIELDS[number])) {
        reverseMapping[leadField] = csvCol
      }
    }

    if (!reverseMapping['nome'] || !reverseMapping['telefone']) {
      return NextResponse.json(
        { error: 'Mapeamento deve incluir pelo menos "nome" e "telefone"' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const { rows } = parseCsv(text)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV vazio ou sem dados' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    const errors: { row: number; error: string }[] = []
    let imported = 0

    // Process in batches of 100
    const BATCH_SIZE = 100
    const validRows: { rowIndex: number; data: Record<string, unknown> }[] = []

    for (let i = 0; i < rows.length; i++) {
      const csvRow = rows[i]
      const nome = csvRow[reverseMapping['nome']]?.trim()
      const telefone = csvRow[reverseMapping['telefone']]?.trim()

      if (!nome) {
        errors.push({ row: i + 2, error: 'Nome vazio' })
        continue
      }
      if (!telefone) {
        errors.push({ row: i + 2, error: 'Telefone vazio' })
        continue
      }

      const leadData: Record<string, unknown> = {
        nome,
        telefone,
        email: reverseMapping['email'] ? csvRow[reverseMapping['email']]?.trim() || null : null,
        empresa: reverseMapping['empresa'] ? csvRow[reverseMapping['empresa']]?.trim() || null : null,
        cargo: reverseMapping['cargo'] ? csvRow[reverseMapping['cargo']]?.trim() || null : null,
        origem: reverseMapping['origem'] ? csvRow[reverseMapping['origem']]?.trim() || null : null,
        status: 'novo',
        tags: [],
        custom_fields: {},
        total_calls: 0,
        total_messages: 0,
      }

      validRows.push({ rowIndex: i + 2, data: leadData })
    }

    // Insert in batches
    for (let batchStart = 0; batchStart < validRows.length; batchStart += BATCH_SIZE) {
      const batch = validRows.slice(batchStart, batchStart + BATCH_SIZE)
      const batchData = batch.map((r) => r.data)

      const { data, error } = await supabase
        .from('sdr_leads')
        .insert(batchData)
        .select('id')

      if (error) {
        console.error('[api/sdr/leads/import] batch error:', error.message)
        for (const item of batch) {
          errors.push({ row: item.rowIndex, error: error.message })
        }
      } else {
        imported += data?.length || 0
      }
    }

    return NextResponse.json({ imported, errors })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/leads/import] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
