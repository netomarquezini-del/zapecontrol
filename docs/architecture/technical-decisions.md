# FesteJá Control — Decisões Técnicas de Arquitetura

## ADR-001: Monorepo com Next.js App Router

**Decisão:** Aplicação única Next.js 14 com App Router (app directory).

**Estrutura:**
```
festeja/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (auth)/             # Route group: login
│   │   │   └── login/
│   │   ├── (dashboard)/        # Route group: authenticated pages
│   │   │   ├── layout.tsx      # Sidebar + header layout
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── products/       # Cadastro de produtos
│   │   │   ├── production/     # Lançamento de produção
│   │   │   ├── goals/          # Metas e regras
│   │   │   ├── reports/        # Exportação
│   │   │   └── settings/       # Usuários e configurações
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── products/
│   │   │   ├── production/
│   │   │   ├── goals/
│   │   │   ├── scoring-rules/
│   │   │   └── export/
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Componentes base (shadcn/ui)
│   │   ├── layout/             # Sidebar, Header, etc.
│   │   ├── products/           # Componentes de produto
│   │   ├── production/         # Componentes de produção
│   │   ├── dashboard/          # Cards, gráficos
│   │   └── forms/              # Formulários reutilizáveis
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── admin.ts        # Service role client
│   │   ├── auth/
│   │   │   ├── options.ts      # NextAuth config
│   │   │   └── permissions.ts  # Role-based access control
│   │   ├── scoring.ts          # Scoring engine
│   │   └── utils.ts
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── middleware.ts           # Auth middleware
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── seed.sql                # Dados iniciais
├── public/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Justificativa:** App Router é o padrão do Next.js 14, route groups organizam auth vs dashboard, API routes eliminam necessidade de backend separado.

## ADR-002: Supabase como Backend-as-a-Service

**Decisão:** Supabase para DB (PostgreSQL), Auth helper, e Storage.

**Nota:** NextAuth.js como auth principal, Supabase apenas como database + storage. Não usar Supabase Auth.

**Configuração:**
- Database: PostgreSQL com RLS habilitado
- Storage: Bucket `product-photos` (público para leitura, auth para escrita)
- Realtime: Desabilitado (não necessário para MVP)

**Free Tier:**
- 500MB database ✅ (100 produtos + lançamentos = ~50MB/ano)
- 1GB storage ✅ (100 fotos * 2MB = ~200MB)
- 50k auth requests/mês ✅ (10 usuários)

## ADR-003: NextAuth.js com Credentials Provider

**Decisão:** NextAuth.js com CredentialsProvider + Supabase como database adapter.

**Fluxo:**
1. Admin cria usuário via UI → insere em `users` com senha hasheada (bcrypt)
2. Login via email + senha → NextAuth valida contra `users` table
3. JWT session com role embutida → middleware verifica permissões
4. Middleware protege todas as rotas `(dashboard)/*`

**Session payload:**
```ts
{
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'gerente' | 'operador'
  }
}
```

## ADR-004: shadcn/ui como Design System

**Decisão:** shadcn/ui para componentes base + Tailwind CSS.

**Componentes a usar:** Button, Input, Select, Table, Dialog, Card, Badge, Tabs, DropdownMenu, Command (autocomplete), Calendar, Sheet (mobile sidebar).

**Justificativa:** Não é dependência — componentes são copiados no projeto. Customizáveis, acessíveis, consistentes.

## ADR-005: Scoring Engine

**Decisão:** Engine de pontuação server-side com resolução por prioridade.

**Algoritmo:**
```
Para cada production_entry:
  1. Buscar scoring_rules ativas, ordenadas por priority DESC
  2. Para cada regra, verificar se condition_type + condition_value match:
     - specific_sku: product.sku === condition_value
     - product_type: product.type === condition_value
     - category: product.category === condition_value (futuro)
  3. Primeira regra que dá match → aplicar points
  4. Se nenhuma match → fallback 1.0 ponto
  5. Pontos do entry = quantity * points
```

**Cache:** Regras são poucas (~10-20), carregadas em memória por request. Sem necessidade de cache externo.

## ADR-006: Exportação

**Decisão:**
- **Excel:** `xlsx` (SheetJS) — geração server-side via API route
- **PDF:** `@react-pdf/renderer` — geração server-side para layout consistente

**Fluxo:** Frontend chama API route com filtros → API gera arquivo → retorna download.

## ADR-007: Row Level Security (RLS)

**Decisão:** RLS no Supabase para proteção em profundidade.

**Políticas:**
- `users`: Admin lê/escreve todos. Demais lêem somente próprio perfil.
- `products`: Todos lêem. Admin/Gerente escrevem.
- `production_entries`: Todos lêem. Todos inserem. Edição: autor ou Admin. Exclusão: Admin.
- `scoring_rules`: Todos lêem. Admin escreve.
- `goals`: Todos lêem. Admin/Gerente escrevem.

## ADR-008: Database Schema (DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gerente', 'operador')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('embalado', 'desembalado')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production entries
CREATE TABLE production_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  production_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scoring rules
CREATE TABLE scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('product_type', 'specific_sku', 'category')),
  condition_value TEXT NOT NULL,
  points DECIMAL(10,2) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  daily_target DECIMAL(10,2),
  weekly_target DECIMAL(10,2),
  monthly_target DECIMAL(10,2),
  valid_from DATE NOT NULL,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_production_entries_date ON production_entries(production_date);
CREATE INDEX idx_production_entries_product ON production_entries(product_id);
CREATE INDEX idx_production_entries_created_by ON production_entries(created_by);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_scoring_rules_priority ON scoring_rules(priority DESC);
CREATE INDEX idx_goals_product ON goals(product_id);
CREATE INDEX idx_goals_valid ON goals(valid_from, valid_until);
```

---

*Arquitetura definida por Aria (@architect) — FesteJá Control v1.0*
*Data: 2026-03-18*
