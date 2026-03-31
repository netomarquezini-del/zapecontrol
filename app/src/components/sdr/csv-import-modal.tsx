'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

const LEAD_FIELDS = [
  { value: '', label: '-- Ignorar --' },
  { value: 'nome', label: 'Nome' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'cargo', label: 'Cargo' },
  { value: 'origem', label: 'Origem' },
]

function parseCsvPreview(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseRow = (line: string): string[] => {
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

  const headers = parseRow(lines[0])
  const rows: string[][] = []
  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    rows.push(parseRow(lines[i]))
  }

  return { headers, rows }
}

function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim())

  const autoMap: Record<string, string[]> = {
    nome: ['nome', 'name', 'nome completo', 'full name', 'nome_completo'],
    telefone: ['telefone', 'phone', 'tel', 'celular', 'whatsapp', 'fone', 'mobile'],
    email: ['email', 'e-mail', 'e_mail', 'mail'],
    empresa: ['empresa', 'company', 'organizacao', 'org'],
    cargo: ['cargo', 'title', 'job', 'funcao', 'position', 'job_title'],
    origem: ['origem', 'source', 'fonte', 'origin'],
  }

  for (const [field, aliases] of Object.entries(autoMap)) {
    const idx = lowerHeaders.findIndex((h) => aliases.includes(h))
    if (idx !== -1) {
      mapping[headers[idx]] = field
    }
  }

  return mapping
}

export default function CsvImportModal({ isOpen, onClose, onImported }: CsvImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: { row: number; error: string }[] } | null>(null)

  const reset = useCallback(() => {
    setFile(null)
    setHeaders([])
    setPreviewRows([])
    setMapping({})
    setImporting(false)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)

    const text = await f.text()
    const { headers: h, rows } = parseCsvPreview(text)
    setHeaders(h)
    setPreviewRows(rows)
    setMapping(autoMapColumns(h))
  }, [])

  const handleMappingChange = useCallback((csvCol: string, leadField: string) => {
    setMapping((prev) => ({ ...prev, [csvCol]: leadField }))
  }, [])

  const handleImport = useCallback(async () => {
    if (!file) return

    const hasNome = Object.values(mapping).includes('nome')
    const hasTelefone = Object.values(mapping).includes('telefone')
    if (!hasNome || !hasTelefone) {
      alert('Mapeie pelo menos as colunas "Nome" e "Telefone"')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))

      const res = await fetch('/api/sdr/leads/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ imported: 0, errors: [{ row: 0, error: data.error || 'Erro desconhecido' }] })
      } else {
        setResult(data)
        if (data.imported > 0) {
          onImported()
        }
      }
    } catch (err) {
      setResult({ imported: 0, errors: [{ row: 0, error: String(err) }] })
    } finally {
      setImporting(false)
    }
  }, [file, mapping, onImported])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222222] bg-[#111111] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#222222] bg-[#111111] px-6 py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-lime-400" />
            <h2 className="text-lg font-bold text-white">Importar CSV</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          {!file && (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#333333] bg-[#0a0a0a] p-10 cursor-pointer hover:border-lime-400/40 transition-colors"
            >
              <Upload size={32} className="text-zinc-500" />
              <p className="text-sm text-zinc-400">Clique para selecionar um arquivo CSV</p>
              <p className="text-xs text-zinc-600">Suporta .csv com separador , ou ;</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* File Info */}
          {file && (
            <div className="flex items-center justify-between rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={18} className="text-lime-400" />
                <span className="text-sm text-zinc-300">{file.name}</span>
                <span className="text-xs text-zinc-600">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={reset}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Trocar arquivo
              </button>
            </div>
          )}

          {/* Column Mapping */}
          {headers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Mapeamento de Colunas</h3>
              <div className="space-y-2">
                {headers.map((header) => (
                  <div
                    key={header}
                    className="flex items-center gap-4 rounded-lg border border-[#222222] bg-[#0a0a0a] px-4 py-2.5"
                  >
                    <span className="w-40 shrink-0 text-sm text-zinc-400 truncate" title={header}>
                      {header}
                    </span>
                    <span className="text-zinc-600 text-xs">-&gt;</span>
                    <select
                      value={mapping[header] || ''}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="flex-1 rounded-lg border border-[#333333] bg-[#111111] px-3 py-1.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    >
                      {LEAD_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewRows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Pre-visualizacao (primeiras {previewRows.length} linhas)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[#222222]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#222222] bg-[#0a0a0a]">
                      {headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-zinc-500 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-[#1a1a1a]">
                        {headers.map((_, j) => (
                          <td key={j} className="px-3 py-2 text-zinc-400 max-w-[150px] truncate">
                            {row[j] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4 space-y-3">
              <div className="flex items-center gap-2">
                {result.imported > 0 ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={18} className="text-red-400" />
                )}
                <span className="text-sm font-medium text-white">
                  {result.imported} lead{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-400">
                    {result.errors.length} erro{result.errors.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.slice(0, 20).map((e, i) => (
                      <p key={i} className="text-xs text-zinc-500">
                        {e.row > 0 ? `Linha ${e.row}: ` : ''}{e.error}
                      </p>
                    ))}
                    {result.errors.length > 20 && (
                      <p className="text-xs text-zinc-600">
                        ... e mais {result.errors.length - 20} erros
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              className="rounded-xl border border-[#333333] px-5 py-2.5 text-sm text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              {result ? 'Fechar' : 'Cancelar'}
            </button>
            {file && !result && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Importar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
