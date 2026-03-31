# Regras Operacionais — Meta Ads Zapeecomm

> Regras de execucao para o gestor de trafego (Leo) e automacoes (cronjobs)
> Produto: Shopee ADS 2.0 (R$97)
> Modelo: Andromeda + CBO
> Aprovado por: Neto Marquezini
> Data: 2026-03-31
> Referencia: template-campanha-teste.md + template-campanha-escala.md

---

## Guardrails

| Parametro | Valor |
|-----------|-------|
| Produto autorizado | Shopee ADS 2.0 |
| Ticket | R$97 |
| CPA Target | A definir com dados novos (targets antigos nao se aplicam — estrutura mudou) |
| ROAS Target | A definir com dados novos |
| Budget campanha teste | R$1.000/dia (CBO) |
| Budget campanha escala | Escalavel (inicia R$X, cresce com performance) |
| Max criativos por campanha | 15 |
| Min criativos por campanha | 3 |
| Min impressoes antes de julgar | 1.000 |
| Objetivo de campanha | Sales (Purchase) |
| Modelo | Andromeda + CBO |
| Bid Strategy | Highest Volume (Lowest Cost) |
| Atribuicao | 7-day click, 1-day view |
| Schedule | 08h-23h (OFF na madrugada — CPA 2-3x maior) |

---

## Estrutura de Campanha

### Campanha de Teste

```
CAMPANHA TESTE [Nº] (CBO)
  Budget: R$1.000/dia
  Objetivo: Sales (Purchase)
  │
  ├── Ad Set 1 — Broad ADV+ (25-44)
  │   ├── Ad 1 — Vídeo (ângulo A)
  │   ├── Ad 2 — Imagem (ângulo B)
  │   ├── ...
  │   └── Máximo 15 criativos
  │
  ├── Ad Set 2 — Interesse específico (25-44) [opcional]
  │   └── Top criativos da campanha
  │
  └── Ad Set 3 — LAL compradores (25-44) [opcional]
      └── Top criativos da campanha
```

### Campanha de Escala

```
CAMPANHA ESCALA (CBO)
  Budget: Escalável
  Objetivo: Sales (Purchase)
  │
  ├── Ad Set 1 — Broad ADV+ (25-44)
  │   ├── Winner 1 — Vídeo
  │   ├── Winner 2 — Imagem
  │   ├── ...
  │   └── Máximo 15 winners
  │
  ├── Ad Set 2 — Interesse específico (25-44) [opcional]
  │   └── Top winners
  │
  └── Ad Set 3 — LAL compradores (25-44) [opcional]
      └── Top winners
```

### Segmentacao

| Parametro | Valor |
|-----------|-------|
| Idade | 25-44 anos |
| Genero | Todos |
| Localizacao | Brasil |
| Ad Set 1 | Broad com Advantage+ Audience |
| Ad Set 2 | Interesse especifico (sobreposicao < 30%) |
| Ad Set 3 | Lookalike 1% de compradores |
| Exclusao | Compradores ultimos 60 dias |

**Regra:** Multiplos ad sets SOMENTE se publicos forem MUITO diferentes (sobreposicao < 30%).

### Placements (Manual)

**Incluidos:**
- Instagram Feed, Stories, Reels
- Facebook Feed, Stories, Reels

**Excluidos:**
- Audience Network (Classic e Rewarded)
- Facebook Instream Video, Reels Overlay
- Instagram Explore
- Threads, Messenger, Search, Marketplace, Notifications, Profile Feed

---

## Kill Rules

### Campanha de Teste

| # | Situacao | Acao | Prazo |
|---|----------|------|-------|
| 1 | Gastou 2x CPA target, ZERO conversao | **PAUSA IMEDIATO** | Imediato |
| 2 | Gastou 1.5x CPA target, apenas 1 conversao | **MONITORA 48h** | Espera |
| 3 | CPA 50%+ acima do target por 5 dias seguidos | **PAUSA** | 5 dias |
| 4 | Frequencia > 3.5 + CTR caindo | **PAUSA** | Imediato |
| 5 | CTR caiu 30%+ vs primeiros 3 dias | **PAUSA** | Imediato |

**Regra de Ouro:** NUNCA pausar antes de 1.000 impressoes.

### Campanha de Escala

| # | Situacao | Acao | Observacao |
|---|----------|------|------------|
| 1 | CPA 50%+ acima do target por 5 dias | **PAUSA** | Mais paciente — criativo ja provou |
| 2 | Frequencia > 3.5 + CTR caindo | **PAUSA** | Saturacao |
| 3 | CTR caiu 30%+ vs media historica | **PAUSA** | Creative fatigue |
| 4 | CPA 3x acima do target com 2.000+ imp | **ARQUIVA** | Sem salvacao |

### Diferenca de Tolerancia Teste vs Escala

| Kill Rule | Na Teste | Na Escala |
|-----------|----------|-----------|
| 2x CPA sem conversao | Pausa imediato | Monitora 48h (ja converteu antes) |
| CPA acima do target | 3-5 dias | 5 dias |
| Frequencia | > 3.0 | > 3.5 |

### Pausar vs Matar (Arquivar)

| Acao | Quando |
|------|--------|
| **PAUSAR** (temporario) | Performance caiu mas pode voltar. Saturacao temporaria. CPA dentro de 1.5-2x target |
| **MATAR** (arquivar) | CPA 3x acima do target com 2.000+ imp. Pausado 2+ semanas sem reuso. Conceito superado |

**Nota:** Winner pausado pode VOLTAR apos 2-3 semanas de descanso. Nao arquive rapido demais.

---

## Regras de Budget

### Dias 1-5: INTOCAVEL

Nao mexer no budget. Andromeda esta aprendendo. Sem excecoes. Aplica para AMBAS as campanhas (teste e escala).

### Dia 6+: Otimizacao DIARIA (±15%)

| CPA medio ultimos 3 dias | Acao |
|--------------------------|------|
| ≤ CPA target | **SOBE +15%** |
| Pouco acima (+10-20%) | **MANTEM** |
| Muito acima (+20-50%) | **DESCE -15%** |
| Disparou (+50%+) | **DESCE -15%** e investiga causa |

### Regra: Nunca mais que 15% por dia. Nunca mexer nos dias 1-5.

### Excecoes — NAO mexer no budget se:

| Situacao | Acao | Por que |
|----------|------|---------|
| Acabou de subir winners novos | ESPERA 7 dias | Andromeda testando novos |
| Acabou de pausar criativos | ESPERA 3-5 dias | CBO recalibrando |

### Janelas de Analise

| Decisao | Janela |
|---------|--------|
| Budget (subir/descer) | Ultimos 3 dias |
| Kill rule de criativo | Ultimos 5 dias |
| Analise semanal | Ultimos 7 dias |

---

## Graduacao — Teste para Escala

### Criterios para Winner

O criativo se torna winner quando atinge TODOS os criterios:

| Criterio | Valor |
|----------|-------|
| CPA | ≤ CPA target por 3-5 dias consecutivos |
| Compras minimas | 5+ compras |
| Impressoes | 1.000+ impressoes |
| Tendencia | CPA estavel ou caindo (nao subindo) |

### Processo de Graduacao

1. Winner identificado na campanha teste
2. NAO pausa no teste — mantem rodando
3. Duplica para campanha de escala usando MESMO Post ID (effective_object_story_id)
4. Prova social (curtidas, comentarios) compartilhada entre teste e escala
5. Criativo roda nas duas campanhas simultaneamente
6. Winner SO sai do teste se campanha lotou (15 ads) e ele e o de menor performance

### Entrada na Escala

- Escala tem vaga (< 15 ads) → Duplica com mesmo Post ID
- Escala lotou (15 ads) → Compara novo winner vs piores da escala. Novo tem CPA melhor? Pausa o pior, entra o novo

---

## Regras de Criativos

| Regra | Valor |
|-------|-------|
| Max por campanha | 15 criativos |
| Min por campanha | 3 criativos |
| Mix obrigatorio | Video + Imagem + Carrossel |
| Variacao de angulo | Cada criativo DEVE ter angulo diferente |
| Variacao de texto | Copies diferentes — texto primario, headline, descricao |
| Pipeline semanal | 3-5 conceitos novos por semana |
| Na escala | SOMENTE winners graduados da teste |

### Texto no Criativo

Cada criativo deve ter combinacao unica de visual + texto. NAO subir 3 visuais diferentes com a mesma copy. Andromeda usa o texto para decidir pra quem mostrar — texto diferente = publico diferente.

### Duplicacao entre Campanhas

| Situacao | Pode? |
|----------|-------|
| Mesmo criativo + publico diferente | SIM |
| Mesmo criativo + mesmo publico (teste e escala) | SIM (via Post ID) |
| Mesmo criativo + mesmo publico (2 escalas) | NUNCA |

---

## Regras de Publico

| Regra | Descricao |
|-------|-----------|
| Teste de criativo | Broad ADV+ (25-44) como principal |
| Multiplos ad sets | Somente se sobreposicao < 30% |
| Na escala | Pode ter multiplos publicos para evitar saturacao |
| Novo publico | Sempre ad set novo, monitorar CPA separado |
| Ad set novo CPA 2x do principal por 7 dias | Pausar |
| CBO distribui | Nao forcar budget por ad set |

---

## Distribuicao de Verba — Quando 1 Criativo Domina

| Cenario | Sinal | Acao |
|---------|-------|------|
| Dominando + CPA bom | 70%+ verba, CPA no target | NAO MEXE — algoritmo funcionando |
| Dominando + CPA subindo | 80%+ verba, CPA subindo 3 dias | Sobe 2-3 winners novos da teste |
| Novos nao pegam tracao | 85%+ verba no dominante | Verificar se novos sao diferentes. Sobe budget +20%. Ultimo recurso: 2o ad set |

---

## Frequencia e Saturacao

| Frequencia | Status | Acao |
|-----------|--------|------|
| 1.0 - 2.0 | SAUDAVEL | Manter, pode escalar |
| 2.0 - 3.0 | ATENCAO | Monitorar, garantir pipeline |
| 3.0 - 3.5 | PREPARAR | Trazer novos winners, comecar rotacao |
| 3.5+ | ACAO | Se CTR caindo → PAUSA o criativo saturado |

### Como Combater Saturacao

1. Criativos novos — trazer winners frescos da teste
2. Publicos diferentes — adicionar ad set com publico novo
3. Pausar e descansar — winner saturado pode voltar apos 2-3 semanas
4. NUNCA aumentar budget pra forcar criativo saturado

---

## Ciclo de Vida do Criativo

| Fase | Duracao | Sinais | Acao |
|------|---------|--------|------|
| Aprendizado | 3-7 dias | CPA instavel, pouca entrega | NAO MEXE. Espera 1.000 impressoes |
| Ramp Up | 3-7 dias | CPA caindo, CTR subindo | Monitora. Se CPA atingir target, preparar graduacao |
| Pico | 7-21 dias | CPA estavel, ROAS bom, freq < 2.5 | Se atingir criterios → GRADUA para escala |
| Declinio | 3-7 dias | CPA subindo, CTR caindo, freq > 3 | Ja deveria ter sido graduado. Manter se ainda vende |
| Morte | — | CPA 2x+ target, freq > 4 | PAUSA. Se 2 semanas pausado → ARQUIVA |

---

## Autonomia do Gestor (Leo)

### Executa Sem Pedir Confirmacao

- Analises e relatorios
- Kill rules (pausar/arquivar conforme regras)
- Ajuste de budget ±15% conforme regras
- Checklist diario

### Pede Confirmacao Antes

- Criar campanha de escala nova
- Criar campanha de teste nova
- Subir lote de criativos
- Qualquer acao fora das regras documentadas

### Regra de Erro (ABSOLUTA — definida pelo Neto 2026-03-26)

- Se QUALQUER erro ocorrer ao subir criativo, campanha ou ad set:
  1. PARA TUDO imediatamente (nao tenta o proximo)
  2. Avisa Neto 1x no Telegram com detalhes do erro
  3. NAO retenta automaticamente
  4. NAO gera spam de notificacoes
  5. Aguarda resolucao manual antes de continuar
- Essa regra se aplica a TODOS os crons

---

## Nomenclatura

### Campanha
```
ShopeeADS | Teste [Nº] | DD-MM-YYYY
ShopeeADS | Escala | DD-MM-YYYY
```

### Ad Set
```
[Tipo Publico] | [Detalhe]
Ex: Broad ADV+ | 25-44
Ex: Interesse | E-commerce
Ex: LAL 1% | Compradores
```

### Ad
```
Exatamente o nome do arquivo/conceito
Ex: AD170 | Video | Shopee Ads
Ex: AD171 | Imagem | Shopee Ads
Ex: AD172 | Carrossel | Shopee Ads
```

---

## Copy Padrao

> ATENCAO: Toda copy DEVE passar pelo ComplianceChecker v2.0 antes de subir.
> Consultar: meta-policy-kb.md secao 3 (Regras de Copy) antes de alterar.

### Texto Primario
```
A maioria dos vendedores de Shopee Ads nao tem problema de produto — tem problema de estrategia.
Descubra o metodo que ja transformou a performance de mais de 4.000 alunos. 📈
```

### Titulo (Headline)
```
Domine o Shopee Ads com Metodo Comprovado
```

### Descricao
```
Treinamento pratico de Shopee Ads com o metodo que gera ROAS acima de 25. Mais de 4.000 alunos ja passaram pelo programa. Aprenda GMV Max, metas de ROAS e otimizacao de orcamento.
Resultados individuais podem variar.
```

### Observacoes de Compliance
- ❌ REMOVIDO: "Voce investe em Shopee Ads" (Personal Attribute)
- ❌ REMOVIDO: "queimando dinheiro" (implica status financeiro negativo)
- ❌ REMOVIDO: "voce vai aprender" (2a pessoa assertiva sobre estado pessoal)
- ❌ REMOVIDO: "pare de desperdicar dinheiro" (implica comportamento do usuario)
- ❌ REMOVIDO: "Garanta" (urgencia excessiva)
- ✅ ADICIONADO: foco no METODO e nos RESULTADOS DE ALUNOS
- ✅ ADICIONADO: disclaimer "Resultados individuais podem variar"
- ✅ MANTIDO: tom tecnico e educativo conforme CLAUDE.md

### CTA
```
Saiba Mais
```

### URL de Destino
```
https://netomarquezini.com.br/curso-ads/
```

### UTMs
```
utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}
```

---

## Upload de Criativos

### Pre-requisitos
1. Criativo produzido (Max + Thomas/Maicon)
2. Campanha de teste tem vaga (< 15 ads ativos)
3. Compliance verificado (meta-policy-kb.md)

### Regras de Upload
- Anti-ban: Delay humanizado 15-30s entre cada upload
- Rate limit: Max 60 escritas/hora na API
- Video: Aguardar processamento (polling 5s, timeout 2min). So criar creative quando video_status = ready
- Thumbnail: Buscar automatica via /{videoId}/thumbnails
- Creative config: Todos os OPT_OUT aplicados

---

## Metas e Benchmarks

| Metrica | Target | Aceitavel | Alerta | Kill |
|---------|--------|-----------|--------|------|
| CPA | A definir | +30% target | +50% target (3 dias) | 2x target sem conversao / 3x target |
| ROAS | A definir | -20% target | < 1.2x (3 dias) | < 1.0x (5 dias) |
| Connect Rate | > 80% | > 70% | < 70% | < 60% |
| Frequencia | < 2.0 | < 3.0 | > 3.0 | > 3.5 + CTR caindo |
| CTR | > 1.2% | > 0.8% | Queda 20% | Queda 30%+ |

**Nota:** CPA e ROAS targets serao calibrados com os dados das primeiras 2 semanas da nova operacao.

---

## Alertas e Comunicacao

| Canal | Conteudo | Frequencia |
|-------|----------|------------|
| Telegram (Neto) | Relatorio diario de performance | 1x/dia (manha) |
| Dashboard tempo real | Metricas consolidadas | Atualizacao continua |

### Alertas Urgentes (Telegram imediato)

- Criativo bateu kill rule (2x CPA sem conversao)
- Frequencia > 3.5 em winner da escala
- ROAS caiu abaixo de 1.0 (prejuizo)
- Budget nao gastou 80% ate 18h
- Erro em qualquer operacao de API

---

## Checklist de Tracking

| Item | O que verificar |
|------|----------------|
| Pixel | Disparando corretamente na pagina de vendas |
| CAPI | Conversions API ativa e deduplicando |
| EMQ | Event Match Quality >= 6.0 |
| Eventos | Purchase, AddToCart, ViewContent, InitiateCheckout ativos |
| Atribuicao | Janela configurada (7d click, 1d view) |
| UTMs | Parametrizadas conforme padrao documentado |
| Deduplicacao | event_id configurado entre Pixel e CAPI |

---

## Orcamento

- Mensal: Sem teto fixo
- Diario: Sem teto fixo
- Regra: Enquanto metricas estiverem dentro dos parametros, pode escalar
- Limite de aumento: Nunca mais que 15% por dia, nunca mexer nos dias 1-5
