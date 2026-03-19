'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFetch } from '@/hooks/use-fetch'
import { Product, Priority } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { PriorityBadge } from '@/components/orders/priority-badge'
import { Plus, Trash2, Save, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface OrderLine {
  product: Product
  quantity: number
  priority: Priority
}

export default function NewOrderPage() {
  const router = useRouter()
  const { data: products } = useFetch<Product[]>('/api/products')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeProducts = products?.filter(p => p.is_active) || []

  function addProduct(product: Product) {
    if (lines.find(l => l.product.id === product.id)) return
    setLines([...lines, { product, quantity: 1, priority: 'normal' }])
    setSearchOpen(false)
  }

  function updateLine(index: number, updates: Partial<OrderLine>) {
    const updated = [...lines]
    updated[index] = { ...updated[index], ...updates }
    if (updates.quantity !== undefined) {
      updated[index].quantity = Math.max(1, updates.quantity)
    }
    setLines(updated)
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!lines.length) return
    setSaving(true)

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: lines.map(l => ({
          product_id: l.product.id,
          quantity: l.quantity,
          priority: l.priority,
        })),
      }),
    })

    if (res.ok) {
      const order = await res.json()
      router.push(`/orders/${order.id}`)
    } else {
      const err = await res.json()
      alert(err.error || 'Erro ao criar pedido')
    }
    setSaving(false)
  }

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Novo Pedido</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            O código do pedido será gerado automaticamente ao salvar.
          </p>
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
                      <div className="flex items-center gap-3 w-full">
                        {product.photo_url ? (
                          <img src={product.photo_url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        {lines.length > 0 ? (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-sm text-muted-foreground">
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-center w-40">Quantidade</th>
                    <th className="p-3 text-center w-40">Prioridade</th>
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
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{line.product.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {line.product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, { quantity: parseInt(e.target.value) || 1 })}
                          className="text-center"
                        />
                      </td>
                      <td className="p-3">
                        <Select
                          value={line.priority}
                          onValueChange={(v) => updateLine(index, { priority: v as Priority })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="urgente">⚡ Urgente</SelectItem>
                            <SelectItem value="critico">🔴 Crítico</SelectItem>
                          </SelectContent>
                        </Select>
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
                {lines.length} produto(s) — {totalQty.toLocaleString('pt-BR')} unidade(s) total
              </p>
              <Button onClick={handleSave} disabled={saving} size="lg">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Criando pedido...' : 'Criar Pedido'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardListIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Adicione produtos para criar o pedido</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  )
}
