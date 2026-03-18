'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, Download } from 'lucide-react'

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(weekAgo)
  const [endDate, setEndDate] = useState(today)
  const [downloading, setDownloading] = useState(false)

  async function downloadExcel() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/export/excel?start=${startDate}&end=${endDate}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `producao-${startDate}-${endDate}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={downloadExcel} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Gerando...' : 'Exportar Excel'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Exporta todos os lançamentos de produção no período selecionado com colunas: Data, SKU, Produto, Tipo, Quantidade, Pontos, Lançado por.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
