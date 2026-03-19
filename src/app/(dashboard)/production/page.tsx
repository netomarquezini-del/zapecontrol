'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useFetch } from '@/hooks/use-fetch'
import { Product, ProductionEntry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Save, Pencil, Factory } from 'lucide-react'

interface EntryLine {
  product: Product
  quantity: number
}

export default function ProductionPage() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id
  const userRole = (session?.user as any)?.role

  const { data: products } = useFetch<Product[]>('/api/products')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [lines, setLines] = useState<EntryLine[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // History
  const [historyDate, setHistoryDate] = useState('')
  const { data: historyData, refetch: refetchHistory } = useFetch<{ data: ProductionEntry[]; total: number }>(
    `/api/production?date=${historyDate || ''}`,
    { skip: false }
  )
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null)
  const [editQuantity, setEditQuantity] = useState('')

  const activeProducts = products?.filter((p) => p.is_active) || []

  function addProduct(product: Product) {
    if (lines.find((l) => l.product.id === product.id)) return
    setLines([...lines, { product, quantity: 1 }])
    setSearchOpen(false)
  }

  function updateQuantity(index: number, qty: number) {
    const updated = [...lines]
    updated[index].quantity = Math.max(1, qty)
    setLines(updated)
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!lines.length) return
    setSaving(true)

    const entries = lines.map((l) => ({
      product_id: l.product.id,
      quantity: l.quantity,
      production_date: date,
    }))

    const res = await fetch('/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    })

    if (res.ok) {
      setLines([])
      refetchHistory()
    }
    setSaving(false)
  }

  async function handleEditSave() {
    if (!editingEntry) return
    await fetch(`/api/production/${editingEntry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: parseInt(editQuantity) }),
    })
    setEditingEntry(null)
    refetchHistory()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir?')) return
    await fetch(`/api/production/${id}`, { method: 'DELETE' })
    refetchHistory()
  }

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Produção</h1>

      <Tabs defaultValue="launch">
        <TabsList>
          <TabsTrigger value="launch">Lançar</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="launch" className="space-y-4">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button onClick={() => setSearchOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
              </Button>
            </div>

            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buscar Produto</DialogTitle>
                </DialogHeader>
                <Command>
                  <CommandInput placeholder="Buscar por SKU ou nome..." />
                  <CommandList>
                    <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                    <CommandGroup>
                      {activeProducts.map((product) => (
                        <CommandItem key={product.id} onSelect={() => addProduct(product)} className="cursor-pointer">
                          <div className="flex items-center gap-3">
                            {product.photo_url ? (
                              <img src={product.photo_url} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                <Factory className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                            </div>
                            <Badge variant="secondary" className="ml-auto">
                              {product.type === 'embalado' ? '📦' : '📋'} {product.type}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>

            {lines.length > 0 && (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 text-sm text-muted-foreground">
                        <th className="p-3 text-left">Produto</th>
                        <th className="p-3 text-left">Tipo</th>
                        <th className="p-3 text-center w-32">Quantidade</th>
                        <th className="p-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr key={line.product.id} className="border-b last:border-0">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {line.product.photo_url ? (
                                <img src={line.product.photo_url} alt="" className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded" />
                              )}
                              <div>
                                <p className="font-medium">{line.product.name}</p>
                                <p className="text-xs text-muted-foreground">SKU: {line.product.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">
                              {line.product.type === 'embalado' ? '📦 Embalado' : '📋 Desembalado'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className="text-center"
                            />
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm" onClick={() => removeLine(index)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {lines.length} produto(s) — {totalQuantity} unidade(s) total
                  </p>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Lançamento'}
                  </Button>
                </div>
              </>
            )}

            {lines.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Adicione produtos para lançar a produção do dia</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex gap-4 mb-4">
              <div className="space-y-2">
                <Label>Filtrar por data</Label>
                <Input type="date" value={historyDate} onChange={(e) => { setHistoryDate(e.target.value); setTimeout(refetchHistory, 100) }} />
              </div>
              {historyDate && (
                <Button variant="outline" className="self-end" onClick={() => { setHistoryDate(''); setTimeout(refetchHistory, 100) }}>
                  Limpar filtro
                </Button>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-sm text-muted-foreground">
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-center">Quantidade</th>
                    <th className="p-3 text-left">Lançado por</th>
                    <th className="p-3 w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData?.data?.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="p-3">{new Date(entry.production_date).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {entry.product?.photo_url && (
                            <img src={entry.product.photo_url} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <div>
                            <p className="font-medium">{entry.product?.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {entry.product?.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-medium">{entry.quantity}</td>
                      <td className="p-3 text-muted-foreground">{entry.user?.name}</td>
                      <td className="p-3 flex gap-1">
                        {(entry.created_by === userId || userRole === 'admin') && (
                          <Button variant="ghost" size="sm" onClick={() => { setEditingEntry(entry); setEditQuantity(String(entry.quantity)) }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {userRole === 'admin' && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!historyData?.data || historyData.data.length === 0) && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum lançamento encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Dialog open={!!editingEntry} onOpenChange={(o) => !o && setEditingEntry(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Quantidade</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" min="1" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleEditSave}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
