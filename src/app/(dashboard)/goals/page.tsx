'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useFetch } from '@/hooks/use-fetch'
import { ScoringRule, Goal, Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function GoalsPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const isAdmin = userRole === 'admin'
  const canManageGoals = userRole === 'admin' || userRole === 'gerente'

  const { data: rules, refetch: refetchRules } = useFetch<ScoringRule[]>('/api/scoring-rules')
  const { data: goals, refetch: refetchGoals } = useFetch<Goal[]>('/api/goals')
  const { data: products } = useFetch<Product[]>('/api/products')

  // Scoring Rules State
  const [ruleOpen, setRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null)
  const [ruleForm, setRuleForm] = useState({
    name: '', condition_type: 'product_type' as string, condition_value: '', points: '1', priority: '0'
  })

  // Goals State
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState({
    product_id: '' as string, daily_target: '', weekly_target: '', monthly_target: '',
    valid_from: new Date().toISOString().split('T')[0], valid_until: ''
  })

  // Scoring Rules handlers
  function openNewRule() {
    setEditingRule(null)
    setRuleForm({ name: '', condition_type: 'product_type', condition_value: '', points: '1', priority: '0' })
    setRuleOpen(true)
  }

  function openEditRule(rule: ScoringRule) {
    setEditingRule(rule)
    setRuleForm({
      name: rule.name,
      condition_type: rule.condition_type,
      condition_value: rule.condition_value,
      points: String(rule.points),
      priority: String(rule.priority),
    })
    setRuleOpen(true)
  }

  async function handleRuleSave(e: React.FormEvent) {
    e.preventDefault()
    const url = editingRule ? `/api/scoring-rules/${editingRule.id}` : '/api/scoring-rules'
    const method = editingRule ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ruleForm,
        points: parseFloat(ruleForm.points),
        priority: parseInt(ruleForm.priority),
      }),
    })
    setRuleOpen(false)
    refetchRules()
  }

  async function deleteRule(id: string) {
    if (!confirm('Excluir regra?')) return
    await fetch(`/api/scoring-rules/${id}`, { method: 'DELETE' })
    refetchRules()
  }

  // Goals handlers
  async function handleGoalSave(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: goalForm.product_id || null,
        daily_target: goalForm.daily_target ? parseFloat(goalForm.daily_target) : null,
        weekly_target: goalForm.weekly_target ? parseFloat(goalForm.weekly_target) : null,
        monthly_target: goalForm.monthly_target ? parseFloat(goalForm.monthly_target) : null,
        valid_from: goalForm.valid_from,
        valid_until: goalForm.valid_until || null,
      }),
    })
    setGoalOpen(false)
    refetchGoals()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metas e Regras</h1>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Regras de Pontuação</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Regras definem quantos pontos cada produto vale. Regras mais específicas (maior prioridade) têm precedência.
            </p>
            {isAdmin && (
              <Button onClick={openNewRule}>
                <Plus className="h-4 w-4 mr-2" /> Nova Regra
              </Button>
            )}
          </div>

          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Condição</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Pontos</th>
                  <th className="p-4">Prioridade</th>
                  <th className="p-4">Status</th>
                  {isAdmin && <th className="p-4">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {rules?.map((rule) => (
                  <tr key={rule.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{rule.name}</td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {rule.condition_type === 'product_type' ? 'Tipo de Produto' :
                         rule.condition_type === 'specific_sku' ? 'SKU Específico' : 'Categoria'}
                      </Badge>
                    </td>
                    <td className="p-4">{rule.condition_value}</td>
                    <td className="p-4 font-bold">{rule.points} pts</td>
                    <td className="p-4">{rule.priority}</td>
                    <td className="p-4">
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="p-4 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditRule(rule)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRuleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Condição</Label>
                  <Select value={ruleForm.condition_type} onValueChange={(v) => setRuleForm({ ...ruleForm, condition_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_type">Tipo de Produto</SelectItem>
                      <SelectItem value="specific_sku">SKU Específico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor da Condição</Label>
                  {ruleForm.condition_type === 'product_type' ? (
                    <Select value={ruleForm.condition_value} onValueChange={(v) => setRuleForm({ ...ruleForm, condition_value: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="embalado">Embalado</SelectItem>
                        <SelectItem value="desembalado">Desembalado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={ruleForm.condition_value} onChange={(e) => setRuleForm({ ...ruleForm, condition_value: e.target.value })} placeholder="Ex: SKU-001" required />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pontos por unidade</Label>
                    <Input type="number" step="0.1" value={ruleForm.points} onChange={(e) => setRuleForm({ ...ruleForm, points: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Input type="number" value={ruleForm.priority} onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })} required />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Preview: Se {ruleForm.condition_type === 'product_type' ? `tipo = ${ruleForm.condition_value || '...'}` : `SKU = ${ruleForm.condition_value || '...'}`} → {ruleForm.points} ponto(s) por unidade
                </p>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Defina metas globais ou por produto em pontos.
            </p>
            {canManageGoals && (
              <Button onClick={() => setGoalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nova Meta
              </Button>
            )}
          </div>

          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4">Escopo</th>
                  <th className="p-4">Diária</th>
                  <th className="p-4">Semanal</th>
                  <th className="p-4">Mensal</th>
                  <th className="p-4">Vigência</th>
                </tr>
              </thead>
              <tbody>
                {goals?.map((goal) => {
                  const product = products?.find((p) => p.id === goal.product_id)
                  return (
                    <tr key={goal.id} className="border-b last:border-0">
                      <td className="p-4 font-medium">
                        {goal.product_id ? product?.name || 'Produto' : 'Global (fábrica)'}
                      </td>
                      <td className="p-4">{goal.daily_target ? `${goal.daily_target} pts` : '—'}</td>
                      <td className="p-4">{goal.weekly_target ? `${goal.weekly_target} pts` : '—'}</td>
                      <td className="p-4">{goal.monthly_target ? `${goal.monthly_target} pts` : '—'}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(goal.valid_from).toLocaleDateString('pt-BR')}
                        {goal.valid_until ? ` — ${new Date(goal.valid_until).toLocaleDateString('pt-BR')}` : ' — Sem fim'}
                      </td>
                    </tr>
                  )
                })}
                {(!goals || goals.length === 0) && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma meta definida</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Meta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGoalSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Escopo</Label>
                  <Select value={goalForm.product_id} onValueChange={(v) => setGoalForm({ ...goalForm, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Global (fábrica toda)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Global (fábrica toda)</SelectItem>
                      {products?.filter((p) => p.is_active).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Diária (pts)</Label>
                    <Input type="number" step="0.1" value={goalForm.daily_target} onChange={(e) => setGoalForm({ ...goalForm, daily_target: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Semanal (pts)</Label>
                    <Input type="number" step="0.1" value={goalForm.weekly_target} onChange={(e) => setGoalForm({ ...goalForm, weekly_target: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Mensal (pts)</Label>
                    <Input type="number" step="0.1" value={goalForm.monthly_target} onChange={(e) => setGoalForm({ ...goalForm, monthly_target: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início Vigência</Label>
                    <Input type="date" value={goalForm.valid_from} onChange={(e) => setGoalForm({ ...goalForm, valid_from: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim Vigência (opcional)</Label>
                    <Input type="date" value={goalForm.valid_until} onChange={(e) => setGoalForm({ ...goalForm, valid_until: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Salvar Meta</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
