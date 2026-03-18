# PRD — FesteJá Control

## 1. Visão Geral

| Campo | Valor |
|-------|-------|
| **Produto** | FesteJá Control |
| **Tipo** | Dashboard interno de controle de produção |
| **Empresa** | FesteJá Store — indústria com vendas online |
| **Objetivo** | Medir performance de produção, controlar produtos fabricados e acompanhar metas |
| **Usuários** | ~10 pessoas (interno) |
| **Hospedagem** | Vercel (frontend) + Supabase (backend/DB/storage) |

## 2. Problema

A FesteJá Store não possui visibilidade centralizada sobre sua produção diária. Não há controle de quais produtos são fabricados, em que quantidade, se as metas estão sendo atingidas, nem dados históricos para comparativo. Decisões são tomadas sem dados estruturados.

## 3. Solução

Sistema web interno com:
- Cadastro de produtos com SKU, nome, foto e classificação
- Lançamento diário de produção por produto
- Sistema de metas com regras configuráveis por tipo de produto
- Dashboard visual com métricas de produção e atingimento de metas
- Controle de acesso por perfil (Admin, Gerente, Operador)

## 4. Usuários e Perfis

### 4.1 Perfis de Acesso

| Perfil | Descrição |
|--------|-----------|
| **Admin** | Acesso total. Gerencia usuários, produtos, metas, regras e visualiza tudo |
| **Gerente** | Cadastra produtos, lança produção, define metas, visualiza dashboards, exporta relatórios |
| **Operador** | Lança produção diária e visualiza dashboards |

### 4.2 Matriz de Permissões

| Funcionalidade | Admin | Gerente | Operador |
|----------------|-------|---------|----------|
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Cadastrar/editar produtos | ✅ | ✅ | ❌ |
| Lançar produção | ✅ | ✅ | ✅ |
| Definir metas | ✅ | ✅ | ❌ |
| Configurar regras de pontuação | ✅ | ❌ | ❌ |
| Visualizar dashboards | ✅ | ✅ | ✅ |
| Exportar relatórios (Excel/PDF) | ✅ | ✅ | ❌ |

## 5. Módulos Funcionais

### M1 — Autenticação e Usuários

**FR-M1.1** Login com email e senha
**FR-M1.2** Cadastro de usuários (somente Admin)
**FR-M1.3** Atribuição de perfil ao usuário (Admin, Gerente, Operador)
**FR-M1.4** Edição e desativação de usuários (somente Admin)
**FR-M1.5** Controle de acesso por menu baseado no perfil
**FR-M1.6** Sessão persistente com logout manual

### M2 — Cadastro de Produtos

**FR-M2.1** Cadastro de produto com campos:
- SKU (único, obrigatório)
- Nome (obrigatório)
- Foto (upload direto, obrigatório)
- Tipo: `embalado` | `desembalado` (obrigatório)
- Status: `ativo` | `inativo`

**FR-M2.2** Upload de foto com preview antes de salvar
**FR-M2.3** Listagem de produtos com busca por SKU ou nome
**FR-M2.4** Edição de produto existente
**FR-M2.5** Inativação de produto (soft delete)
**FR-M2.6** Visualização de detalhes do produto

### M3 — Lançamento de Produção

**FR-M3.1** Tela de lançamento com campos:
- Data do lançamento (default: hoje)
- Produto (busca por SKU ou nome com autocomplete)
- Quantidade produzida (número inteiro positivo)

**FR-M3.2** Ao selecionar produto, exibir: foto, nome, SKU e tipo
**FR-M3.3** Permitir múltiplos lançamentos na mesma tela (adicionar linhas)
**FR-M3.4** Histórico de lançamentos com filtro por data e produto
**FR-M3.5** Edição de lançamento (mesmo dia, pelo autor ou Admin)
**FR-M3.6** Exclusão de lançamento (somente Admin)
**FR-M3.7** Registro automático de quem fez o lançamento e timestamp

### M4 — Metas e Regras de Pontuação

**FR-M4.1** Sistema de pontuação configurável com regras por cenário:

| Regra padrão | Pontuação |
|-------------|-----------|
| Produto embalado | 1.0 ponto por unidade |
| Produto desembalado | 0.5 ponto por unidade |

**FR-M4.2** CRUD de regras de pontuação:
- Nome da regra
- Condição (tipo de produto, SKU específico, categoria, etc.)
- Valor em pontos
- Prioridade (regras mais específicas sobrepõem genéricas)

**FR-M4.3** Definição de meta por período:
- Meta diária (em pontos)
- Meta semanal (em pontos)
- Meta mensal (em pontos)

**FR-M4.4** Metas podem ser globais (fábrica toda) ou por produto
**FR-M4.5** Indicador visual de atingimento:
- 🟢 Verde: >= 100% da meta
- 🟡 Amarelo: 70-99% da meta
- 🔴 Vermelho: < 70% da meta

**FR-M4.6** Histórico de metas (quando alterada, manter registro anterior)

### M5 — Dashboard

**FR-M5.1** Painel principal com cards resumo:
- Produção de hoje (quantidade + pontos)
- Meta de hoje (% atingimento com indicador visual)
- Produção da semana
- Comparativo com semana anterior (↑ ou ↓ %)

**FR-M5.2** Gráfico de barras: produção diária dos últimos 7/14/30 dias
**FR-M5.3** Gráfico de linha: produção vs meta (overlay)
**FR-M5.4** Ranking de produtos mais produzidos (top 10)
**FR-M5.5** Filtros globais:
- Período (data início / data fim)
- Produto específico
- Tipo (embalado / desembalado / todos)

**FR-M5.6** Comparativo período vs período (ex: semana atual vs anterior)
**FR-M5.7** Detalhamento por produto: ao clicar em um produto, ver histórico de produção

### M6 — Exportação

**FR-M6.1** Exportar dashboard atual para PDF
**FR-M6.2** Exportar dados de produção para Excel (.xlsx) com filtros aplicados
**FR-M6.3** Exportar relatório de metas (atingimento por período)

## 6. Requisitos Não-Funcionais

**NFR-1** Tempo de carregamento do dashboard < 2 segundos
**NFR-2** Upload de imagem máximo 5MB, formatos JPG/PNG/WebP
**NFR-3** Responsivo (desktop prioritário, mobile funcional)
**NFR-4** Dados protegidos por Row Level Security (RLS) no Supabase
**NFR-5** Sessão expira após 24h de inatividade
**NFR-6** Suporte a 10 usuários simultâneos sem degradação

## 7. Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 14 + Tailwind CSS | SSR, deploy Vercel nativo |
| Auth | NextAuth.js | Integração nativa Next.js |
| Database | Supabase (PostgreSQL) | Free tier, RLS, Storage integrado |
| Storage | Supabase Storage | Upload de fotos dos produtos |
| Gráficos | Recharts | Leve, boa integração React |
| Export Excel | xlsx (SheetJS) | Biblioteca madura |
| Export PDF | jsPDF + html2canvas | Captura visual do dashboard |
| Deploy | Vercel | Free tier, CI/CD automático |

## 8. Modelo de Dados (Conceitual)

### users
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | string | único |
| name | string | |
| role | enum | admin, gerente, operador |
| is_active | boolean | soft delete |
| created_at | timestamp | |

### products
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| sku | string | único |
| name | string | |
| photo_url | string | Supabase Storage |
| type | enum | embalado, desembalado |
| is_active | boolean | soft delete |
| created_at | timestamp | |

### production_entries
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| product_id | UUID | FK → products |
| quantity | integer | > 0 |
| production_date | date | data da produção |
| created_by | UUID | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |

### scoring_rules
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | string | nome da regra |
| condition_type | enum | product_type, specific_sku, category |
| condition_value | string | ex: "embalado", SKU específico |
| points | decimal | pontos por unidade |
| priority | integer | maior = mais específica |
| is_active | boolean | |

### goals
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| product_id | UUID | FK nullable (null = global) |
| daily_target | decimal | pontos |
| weekly_target | decimal | pontos |
| monthly_target | decimal | pontos |
| valid_from | date | início vigência |
| valid_until | date | nullable |

## 9. Fases de Entrega

### Fase 1 — MVP (Estimativa: Epic 1)
- [x] PRD criado
- [ ] Auth (login, cadastro de usuários, perfis)
- [ ] Cadastro de produtos (SKU, nome, foto, tipo)
- [ ] Lançamento diário de produção
- [ ] Listagem/histórico básico

**Entrega:** Sistema funcional para cadastrar produtos e lançar produção diária.

### Fase 2 — Core (Estimativa: Epic 2)
- [ ] Dashboard com métricas (diário, semanal, por produto)
- [ ] Sistema de metas com regras configuráveis
- [ ] Indicadores visuais de atingimento
- [ ] Gráficos de produção vs meta

**Entrega:** Visibilidade completa de produção com metas.

### Fase 3 — Complementar (Estimativa: Epic 3)
- [ ] Exportação Excel
- [ ] Exportação PDF
- [ ] Comparativo período vs período
- [ ] Filtros avançados

**Entrega:** Relatórios exportáveis e análise comparativa.

### Fase 4 — Evolução (Futuro)
- [ ] Lançamento por turno
- [ ] Notificações (meta atingida, abaixo do esperado)
- [ ] Categorias de produtos
- [ ] Dashboard mobile otimizado

## 10. Critérios de Sucesso

| Métrica | Target |
|---------|--------|
| Todos os operadores lançando produção diária | Dentro de 1 semana do deploy |
| Tempo médio de lançamento | < 30 segundos por entrada |
| Acurácia dos dados vs produção real | > 95% |
| Adoção do dashboard por gerentes | 100% em 2 semanas |

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Baixa adesão dos operadores | Alto | UI simples, treinamento, lançamento em < 30s |
| Fotos pesadas travando upload | Médio | Limite 5MB, compressão client-side |
| Regras de pontuação complexas | Médio | Começar com 2 regras padrão, expandir sob demanda |
| Free tier Supabase insuficiente | Baixo | 500MB DB + 1GB storage cobre bem 100 produtos |

## 12. Fora de Escopo

- E-commerce / vendas online
- Integração com ERP externo
- App mobile nativo
- Gestão de estoque/matéria-prima
- Financeiro / custos de produção
- Multi-fábrica

---

*PRD gerado por Morgan (@pm) — FesteJá Control v1.0*
*Baseado na análise de discovery do Atlas (@analyst)*
*Data: 2026-03-18*
