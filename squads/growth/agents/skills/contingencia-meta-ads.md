# Skill: Contingência Meta Ads — Léo (Gestor de Tráfego)
# Plano de contingência para conta suspensa, banida ou restrita
# Ativado automaticamente quando: conta restrita, ad rejeitado, account quality baixo
# Última atualização: 2026-03-26

---

## QUANDO ESTA SKILL É ATIVADA

O Léo DEVE ativar esta skill automaticamente quando detectar:
1. Account status ≠ 1 (ACTIVE) na API
2. Account Quality Score ≤ 4
3. Mais de 3 ads rejeitados em 24h
4. Erro de API com disable_reason preenchido
5. Notificação de restrição no Business Manager
6. Qualquer menção do Neto sobre "conta suspensa", "conta banida", "conta restrita"

---

## NÍVEL 1: ALERTA PREVENTIVO (Score 5-6 ou 2-3 rejeições)

### Ações Imediatas (Executar SEM pedir confirmação)
1. **PAUSAR** todos os crons de criação (leo-criativos, leo-publicos)
2. **Notificar** Neto via Telegram: "⚠️ ALERTA: Account Quality em [X]. Pausei criação de novos ads."
3. **Auditar** últimos 10 ads criados:
   - Rodar ComplianceChecker v2.0 em cada um
   - Identificar quais violam regras
   - Pausar ads problemáticos
4. **Documentar** em log: data, score, ads problemáticos, ação tomada

### Análise de Causa
Consultar meta-policy-kb.md e identificar:
- Qual regra foi violada (Personal Attributes? Income Claims? LP mismatch?)
- Se é padrão recorrente ou incidente isolado
- Se mudança recente no criativo/copy/LP causou o problema

### Ações de Remediação
1. Corrigir ads identificados (editar copy, trocar criativo, ajustar LP)
2. Esperar **48h** antes de reativar crons
3. Monitorar score diariamente por 7 dias
4. Se score voltar para 7+: reativar crons gradualmente

---

## NÍVEL 2: CONTA RESTRITA (Score 2-4 ou account_status ≠ 1)

### Ações Imediatas (Executar SEM pedir confirmação)
1. **PARAR TUDO** — pausar todos os crons e campanhas ativas
2. **Notificar** Neto via Telegram com urgência:
   ```
   🚫 CONTA RESTRITA — TUDO PAUSADO
   Status: [status code e disable_reason]
   Ação: Nenhum ad será criado/editado até resolver.
   Próximo passo: Auditoria + Appeal
   ```
3. **NÃO** tentar criar novos ads, campanhas ou ad sets
4. **NÃO** tentar resubmeter ads rejeitados sem corrigir

### Processo de Appeal (6 Passos)

**Passo 1: Identificar o Problema**
```
GET /act_{AD_ACCOUNT_ID}?fields=account_status,disable_reason,failed_delivery_checks
```
- Mapear disable_reason para causa específica
- Consultar tabela de disable reasons no KB (seção 11.2 api-reference)

**Passo 2: Auditoria Interna Completa**
- Revisar TODOS os ads ativos e recentemente rejeitados
- Verificar TODAS as landing pages (conteúdo, load time, privacy policy)
- Checar métodos de pagamento (cartão válido, sem declined)
- Verificar business verification status
- Rodar ComplianceChecker v2.0 em TODA a copy ativa

**Passo 3: Corrigir TUDO Antes de Apelar**
- Pausar/deletar ads violadores
- Corrigir LPs problemáticas
- Atualizar copy para compliance
- Resolver problemas de pagamento
- NÃO apelar antes de corrigir

**Passo 4: Submeter Appeal**
- Business Support Home → Account status overview → conta restrita → Request review
- Tom: **profissional, respeitoso, factual**
- Incluir:
  - O que aconteceu
  - O que foi corrigido (específico)
  - Compromisso com compliance futuro
  - Screenshots de correções se aplicável

**Passo 5: Aguardar**
- Tempo típico: **48 horas** (até 5 dias úteis em Q4/feriados)
- **NÃO** submeter múltiplos appeals simultaneamente
- **NÃO** criar nova conta para bypass (ban permanente)

**Passo 6: Se Negado**
- Submeter novo appeal com **informação NOVA** (não repetir o mesmo)
- Prova de identidade, evidência de correção, documentação adicional
- Se negado 2x: avaliar estratégia de contingência (Nível 3)

### Timeline Crítica
- Apelar **dentro do prazo** especificado ou perde capacidade
- Contas desabilitadas **180+ dias** = irrecuperável
- Violações severas = irrecuperável

---

## NÍVEL 3: CONTA BANIDA PERMANENTE (Pior Cenário)

### Ações Imediatas
1. **Notificar** Neto via Telegram:
   ```
   🔴 CONTA BANIDA — ATIVANDO CONTINGÊNCIA
   Razão: [disable_reason]
   Esta conta NÃO pode ser recuperada.
   Ativando plano de continuidade.
   ```
2. **Parar TODOS os serviços** do Léo (PM2 stop all leo-*)
3. **Exportar dados** que ainda estiverem acessíveis:
   - Relatórios de insights (se API ainda responde)
   - Listas de audiências
   - Registro de criativos winners

### Plano de Continuidade

**Opção A: Ad Account Nova no Mesmo BM**
- Se BM não foi banido, criar nova ad account
- Limite: até 25 ad accounts por BM
- Reconfigurar: Pixel, CAPI, pagamento, verificação
- **Warming obrigatório:** 2-4 semanas antes de escalar

**Opção B: Novo Business Manager**
- Se BM foi banido junto
- Criar novo BM com OUTRA pessoa como admin (2 BMs por pessoa)
- **NÃO** usar mesmo perfil pessoal se foi banido
- Verificação de negócio obrigatória antes de ads
- Processo completo: 30-60 dias até operação plena

**Opção C: Diversificação de Plataforma (Temporário)**
- Google Ads para search intent
- TikTok Ads para awareness/consideration
- YouTube Ads para demonstração/educação
- **Manter funil ativo** enquanto resolve Meta

### Reconstrução (Nova Conta)
1. **Semana 1-2:** Setup (BM, verificação, Pixel, CAPI, domínio)
2. **Semana 3-4:** Warming (atividade orgânica, budget mínimo)
3. **Semana 5-6:** Teste de criativos (com ComplianceChecker v2.0 ANTES)
4. **Semana 7+:** Escala gradual (regra dos 20%)
5. **TODO ad passa pelo compliance checker** antes de subir — SEMPRE

---

## CHECKLIST DE PREVENÇÃO (EXECUTAR SEMANALMENTE)

- [ ] Account Quality Score ≥ 7?
- [ ] Algum ad rejeitado nos últimos 7 dias?
- [ ] Pagamento em dia, sem declined?
- [ ] Business verification ativa?
- [ ] 2FA ativo para todos os admins?
- [ ] Compliance checker atualizado?
- [ ] Copy atual passa no compliance check?
- [ ] LPs carregam em < 3s?
- [ ] LPs têm privacy policy e termos visíveis?
- [ ] Domínio verificado?
- [ ] CAPI + Pixel funcionando? EMQ ≥ 6?
- [ ] Método de pagamento backup ativo?
- [ ] Criativos sem personal attributes ou income claims?

**Se qualquer item falhar: corrigir IMEDIATAMENTE antes de continuar operação.**

---

## BACKUP DE ASSETS (MANTER SEMPRE ATUALIZADO)

### O Que Salvar (Fora da Meta)
1. **Criativos winners** — Todos os arquivos originais em `/squads/zapeads/criativos/`
2. **Copy aprovada** — Textos que passaram no compliance e performaram
3. **Dados de audiência** — IDs de interesse, configurações de público
4. **Configurações de campanha** — Nomenclatura, budgets, targeting
5. **Relatórios de performance** — Histórico no Supabase
6. **Pixel e CAPI config** — IDs, tokens, event mappings

### Onde Salvar
- Repositório local (já temos em `/squads/zapeads/`)
- Supabase (sync automático a cada 30min via leo-engine)
- Backup manual mensal dos JSONs de estado

---

## INTEGRAÇÃO COM CRONS DO LÉO

### leo-engine (start.js)
- Verificar `account_status` em cada sync (a cada 30min)
- Se status ≠ 1: ativar Nível 2 automaticamente
- Se `opportunity_score` < 50: ativar Nível 1

### leo-criativos (cron-criativos.js)
- Antes de qualquer upload: verificar account_status
- Se não ACTIVE: **abortar** e notificar

### leo-publicos (cron-publicos.js)
- Antes de qualquer criação: verificar account_status
- Se não ACTIVE: **abortar** e notificar

---

## COMUNICAÇÃO COM NETO

### Template de Notificação — Nível 1
```
⚠️ ALERTA PREVENTIVO — Léo

Account Quality: [X]/10
Ads rejeitados: [N] nas últimas 24h
Ação tomada: Crons de criação pausados
Próximo passo: Auditoria em andamento

— Léo (Compliance v2.0)
```

### Template de Notificação — Nível 2
```
🚫 CONTA RESTRITA — Léo

Status: [disable_reason]
Ação tomada: TUDO pausado
Próximo passo: Auditoria + Appeal
Tempo estimado: 48h-5 dias para resolução

NÃO criar nova conta. Seguindo protocolo de recovery.

— Léo (Compliance v2.0)
```

### Template de Notificação — Nível 3
```
🔴 CONTA BANIDA — Léo

Status: PERMANENT_CLOSE
Razão: [disable_reason]
Ação tomada: Todos os serviços parados
Plano de contingência ativado

Opções:
A) Nova ad account no mesmo BM (se BM não banido)
B) Novo BM (30-60 dias para operação plena)
C) Diversificar plataforma temporariamente

Aguardando sua decisão para prosseguir.

— Léo (Compliance v2.0)
```

---

# FONTES
- meta-policy-kb-antiban.md (Account Health, Recovery)
- meta-policy-kb-advanced.md (Business Verification, Contingência, Pagamentos)
- meta-policy-kb-api-reference.md (Ad Account API, Status Codes, Disable Reasons)
- meta-policy-kb.md (Compliance Rules, Copy Rules)
- blackscale.media (Account Suspensions Prevention)
- agrowth.io (Business Verification Process)
