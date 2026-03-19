'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useFetch } from '@/hooks/use-fetch'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Search, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function ProductsPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const canEdit = userRole === 'admin' || userRole === 'gerente'

  const { data: products, loading, refetch } = useFetch<Product[]>('/api/products')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ sku: '', name: '', type: 'embalado' as string, photo_url: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const filtered = products?.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  function openNew() {
    setEditing(null)
    setForm({ sku: '', name: '', type: 'embalado', photo_url: '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({ sku: product.sku, name: product.name, type: product.type, photo_url: product.photo_url || '' })
    setPhotoFile(null)
    setPhotoPreview(product.photo_url)
    setOpen(true)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB.')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return form.photo_url || null
    setUploading(true)

    const ext = photoFile.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('product-photos')
      .upload(fileName, photoFile, { upsert: true })

    setUploading(false)
    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data } = supabase.storage.from('product-photos').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const photo_url = await uploadPhoto()

    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, photo_url }),
    })

    setSaving(false)
    setOpen(false)
    refetch()
  }

  async function toggleActive(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !product.is_active }),
    })
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      required
                      disabled={!!editing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="embalado">Embalado</SelectItem>
                        <SelectItem value="desembalado">Desembalado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Foto</Label>
                    <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
                    {photoPreview && (
                      <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-md mt-2" />
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={saving || uploading}>
                    {saving ? 'Salvando...' : uploading ? 'Enviando foto...' : 'Salvar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-lg border p-4 space-y-3">
              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                {product.photo_url ? (
                  <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground opacity-30" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {product.type === 'embalado' ? '📦 Embalado' : '📋 Desembalado'}
                </Badge>
                {!product.is_active && <Badge variant="destructive">Inativo</Badge>}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(product)}
                  >
                    {product.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
