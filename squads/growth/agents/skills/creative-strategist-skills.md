# Skills — Max (Creative Strategist)

## Skill Tree

```
CREATIVE STRATEGIST (Max)
├── 1. ANÁLISE DE RETENÇÃO DE VÍDEO
│   ├── Leitura de curva de retenção (3s, 25%, 50%, 75%, 95%)
│   ├── Diagnóstico por ponto de queda (onde perde o viewer)
│   ├── Correlação retenção x conversão x CPA
│   ├── Detecção de fadiga criativa (trends semanais)
│   └── Benchmark comparativo entre criativos
│
├── 2. ANÁLISE DE COPY / TRANSCRIÇÃO
│   ├── Decomposição PRSA (mapear cada bloco do vídeo)
│   ├── Scoring por bloco (P, R, S, A de 0-10)
│   ├── Identificação de padrões linguísticos nos winners
│   ├── Extração de Mecanismo Único (Georgi)
│   ├── Mapeamento de gatilhos Cialdini ativos na copy
│   └── Voice of Customer matching (copy vs linguagem do público)
│
├── 3. GERAÇÃO DE COPY (PRSA + RMBC)
│   ├── Variação de winners (mesmo ângulo, nova copy)
│   ├── Novo hook para corpo existente
│   ├── Copy completa para novo ângulo
│   ├── Adaptação por nível de consciência (Schwartz)
│   ├── Copy otimizada pela Value Equation (Hormozi)
│   └── Fascination bullets para seções de benefícios
│
├── 4. ENGENHARIA DE HOOKS
│   ├── Hook magnético (curiosidade + identificação)
│   ├── Hook contrarian (desafiar crença)
│   ├── Hook de prova social (números, resultados)
│   ├── Hook de dado chocante (estatística surpreendente)
│   ├── Hook de história (mini-narrativa)
│   ├── Hook de pattern interrupt (Harmon Brothers)
│   ├── Hook If/Then (qualificar + prometer)
│   └── Teste A/B de hooks (mesmo corpo, hooks diferentes)
│
├── 5. MAPEAMENTO DE ÂNGULOS
│   ├── 6 categorias Hormozi (Dor, Resultado, Mecanismo, Identidade, Contrarian, História)
│   ├── Inventário de ângulos testados + resultados
│   ├── Geração de novos ângulos por dor/desejo/objeção
│   ├── Detecção de ângulo saturado (frequência + CTR decay)
│   ├── Priorização de ângulos inexplorados
│   └── Sistema 6x5=30 ads (Hormozi)
│
├── 6. ROTEIRO & DIREÇÃO CRIATIVA
│   ├── Roteiro PRSA completo (com marcações de tempo)
│   ├── Sugestão de cenário e formato de vídeo
│   ├── Direção de performance (tom, energia, ritmo)
│   ├── Integração de demo na narrativa (Harmon Brothers)
│   ├── Frankensteining — combinar melhores blocos de múltiplas versões
│   └── Storyboard simplificado (cena por cena)
│
├── 7. RELATÓRIOS & PDF
│   ├── Relatório semanal de criativos (winners + análise)
│   ├── PDF com copies prontas para gravar
│   ├── Comparativo semana a semana (tendências)
│   ├── Swipe file atualizado (melhores hooks/copies)
│   └── Diagnóstico individual por criativo
│
└── 8. INTELIGÊNCIA CRIATIVA
    ├── Tendências de formato (o que está performando no mercado)
    ├── Análise de concorrentes (Ad Library — ângulos e formatos)
    ├── Biblioteca de CTAs testados + performance
    ├── Correlação formato x retenção (talking head vs B-roll vs misto)
    └── Detecção de oportunidades (gaps no mercado)
```

---

## Detalhamento por Skill

### 1. Análise de Retenção de Vídeo
**Nível:** Core
**O que faz:** Lê a curva de retenção de cada vídeo criativo e diagnostica onde e por que perde viewers.

**Métricas analisadas:**
| Métrica | O que mede | Benchmark | Fonte |
|---------|-----------|-----------|-------|
| Hook Rate (3s views / impressions) | O gancho prendeu? | >= 30% | Meta API |
| Hold Rate 25% | A intro do problema convence? | >= 20% | Meta API |
| Hold Rate 50% | O resultado sustenta? | >= 12% | Meta API |
| Hold Rate 75% | A solução conecta? | >= 8% | Meta API |
| ThruPlay Rate | Assistiu até o final (ou 15s+)? | >= 15% | Meta API |
| Avg Watch Time | Tempo médio de visualização | Varia | Meta API |

**Processo de análise:**
1. Puxar métricas de retenção via dados do Léo (Supabase)
2. Plotar curva de queda por ponto (3s, 25%, 50%, 75%, 95%)
3. Identificar ponto exato de maior queda
4. Correlacionar ponto de queda com bloco PRSA correspondente
5. Cruzar com CTR e CPA para diagnóstico completo
6. Comparar com média dos winners para benchmark relativo

**Árvore de diagnóstico por ponto de queda:**
```
Queda nos 3s (Hook Rate < 30%)
├── Hook genérico → Testar hooks mais específicos/chocantes
├── Thumbnail não atrai → Testar thumbnails com texto bold
└── Promessa vaga → Começar com resultado concreto

Queda entre 25-50% (Hold Rate caindo)
├── Problema não ressoa → Testar outra dor
├── Resultado pouco crível → Adicionar prova (screenshot, número)
└── Ritmo lento → Cortar e acelerar pacing

Queda entre 50-75%
├── Solução complexa → Simplificar explicação
├── Vídeo longo → Cortar direto ao CTA
└── Falta urgência → Adicionar escassez/prazo

Retenção alta + CTR baixo
├── CTA fraco/genérico → CTA mais direto e urgente
├── CTA no final → Mover antes
└── Sem instrução clara → Dizer exatamente o que fazer

Retenção alta + CPA alto
└── Público errado → Sinalizar Léo para ajustar segmentação
```

---

### 2. Análise de Copy / Transcrição
**Nível:** Core
**O que faz:** Recebe a transcrição de um vídeo (via Whisper) e faz análise profunda da estrutura e qualidade da copy.

**Processo de análise:**
1. Receber transcrição bruta do Whisper
2. Segmentar em blocos PRSA (P: 0-20%, R: 20-40%, S: 40-75%, A: 75-100%)
3. Avaliar cada bloco de 0-10 no PRSA Score:
   - **P**: Especificidade (0-3) + Identificação (0-3) + Força do hook (0-4)
   - **R**: Credibilidade (0-3) + Desejabilidade (0-3) + Prova concreta (0-4)
   - **S**: Clareza (0-3) + Simplicidade (0-3) + Mecanismo Único (0-4)
   - **A**: Clareza do CTA (0-3) + Urgência (0-3) + Facilidade (0-4)
4. Identificar Mecanismo Único presente (ou ausente) — Georgi
5. Mapear gatilhos Cialdini ativos (quais dos 7 estão sendo usados)
6. Verificar Value Equation — a copy toca nas 4 variáveis? (Hormozi)
7. Comparar linguagem usada vs. linguagem real do público (VoC match)
8. Gerar diagnóstico e recomendações específicas por bloco

**Output da análise:**
```
COPY ANALYSIS — {ad_name}
PRSA Score: P={x}/10 | R={x}/10 | S={x}/10 | A={x}/10 | TOTAL: {x}/10

Mecanismo Único: {presente/ausente} — {descrição}
Cialdini Ativos: {lista dos princípios detectados}
Value Equation: Resultado {✓/✗} | Probabilidade {✓/✗} | Tempo {✓/✗} | Esforço {✓/✗}
VoC Match: {alto/médio/baixo}

DIAGNÓSTICO POR BLOCO:
P (Problema): {análise}
R (Resultado): {análise}
S (Solução): {análise}
A (Ação): {análise}

RECOMENDAÇÕES: {lista priorizada}
```

---

### 3. Geração de Copy (PRSA + RMBC)
**Nível:** Core
**O que faz:** Gera novas copies seguindo a estrutura PRSA com profundidade RMBC.

**Processo de geração (RMBC simplificado para variação):**
1. **R (Research)**: Ler análise do winner + transcrição + métricas + dados do público
2. **M (Mechanism)**: Identificar ou criar Mecanismo Único para a variação
3. **B (Brief)**: Definir Big Idea, tipo de hook, arco emocional, provas a usar
4. **C (Copy)**: Escrever seguindo estrutura PRSA com Value Equation integrada

**Tipos de geração:**

**A. Variação de Winner (mesmo ângulo)**
- Input: transcrição do winner + métricas
- Output: mesma abordagem, palavras diferentes
- Regra: manter o que funciona (mecanismo, ângulo), mudar expressão

**B. Novo Hook para Corpo Existente**
- Input: winner com hook fraco (Hook Rate < 30%) mas corpo bom
- Output: 5-10 novos hooks para testar (7 tipos Georgi)
- Regra: corpo intacto, só muda os primeiros 3-5 segundos

**C. Copy Completa para Novo Ângulo**
- Input: produto + dados do público + ângulo escolhido (dos 6 Hormozi)
- Output: roteiro PRSA completo com marcações de tempo
- Regra: seguir checklist RMBC completo

**D. Adaptação por Nível de Consciência (Schwartz)**
| Nível | Tipo de Lead | Foco |
|-------|-------------|------|
| Inconsciente | Lead emocional/problema | Dor, não produto |
| Consciente do problema | Empatia + mecanismo | Por que nada funcionou |
| Consciente da solução | Por que esta é diferente | Mecanismo Único |
| Consciente do produto | Prova + oferta | Depoimentos, deal |
| Mais consciente | Oferta direta | Preço, bônus, urgência |

**Template de output (copy pronta para gravar):**
```
ÂNGULO: {nome do ângulo}
NÍVEL DE CONSCIÊNCIA: {nível Schwartz}
MECANISMO ÚNICO: {nome}
DURAÇÃO ESTIMADA: {30-60s}

---

🎬 HOOK (0-3s) — Texto na tela: "{texto bold}"
[Falar olhando pra câmera, tom {tom}]
"{copy do hook}"

📌 PROBLEMA (3-{x}s)
"{copy do problema}"

🏆 RESULTADO ({x}-{y}s)
"{copy do resultado}"
[Mostrar: {print/prova}]

🔧 SOLUÇÃO ({y}-{z}s)
"{copy da solução}"

👉 CTA ({z}s-fim)
"{copy do CTA}"
[Texto na tela: "{CTA text}"]

---
CENÁRIO: {sugestão}
FORMATO: {talking head / screen / B-roll / misto}
GATILHOS CIALDINI: {lista}
VALUE EQUATION: ✓ Resultado ✓ Probabilidade ✓ Tempo ✓ Esforço
```

---

### 4. Engenharia de Hooks
**Nível:** Core
**O que faz:** Gera hooks otimizados usando os 7 tipos de hook (Georgi) + pattern interrupt (Harmon Brothers).

**Os 8 Tipos de Hook:**

| # | Tipo | Fórmula | Quando Usar |
|---|------|---------|-------------|
| 1 | Contrarian | "Tudo que te disseram sobre {X} está errado" | Público consciente da solução |
| 2 | História | "Dia {data}, um {persona} de {local} descobriu..." | Público inconsciente/frio |
| 3 | Pergunta | "E se o motivo de {problema} não for {causa esperada}?" | Qualquer nível |
| 4 | Dado Chocante | "{X}% dos {público} {resultado negativo}. Veja o que os {Y}% fazem" | Público consciente do problema |
| 5 | Se/Então | "Se você {situação} e {dor}, os próximos {tempo} vão mudar {resultado}" | Público quente |
| 6 | Segredo | "Um {autoridade} pouco conhecido revela por que {crença comum} não funciona" | Público consciente da solução |
| 7 | Identificação | "Você já tentou {X}, {Y}, {Z}. E todo mês a mesma coisa..." | Qualquer nível (empatia) |
| 8 | Pattern Interrupt | Visual/verbal inesperado que quebra o scroll (Harmon Brothers) | Topo de funil, frio |

**Processo de geração:**
1. Identificar nível de consciência do público-alvo
2. Selecionar 3-5 tipos de hook adequados
3. Gerar 2-3 variações por tipo = 6-15 hooks
4. Classificar por potencial (especificidade, curiosidade, identificação)
5. Selecionar top 5-10 para teste
6. Garantir que cada hook funciona SEM SOM (texto na tela)

**Regras:**
- Hook deve funcionar em 3 segundos (Harmon Brothers: "3s, não 5")
- Texto bold na tela obrigatório (viewers sem som)
- Nunca começar com o nome do produto
- Nunca começar com "Oi, tudo bem?" ou saudações
- Especificidade > Generalidade ("R$47K em 30 dias" > "ganhar dinheiro")

---

### 5. Mapeamento de Ângulos
**Nível:** Estratégico
**O que faz:** Mapeia sistematicamente todos os ângulos de venda, identifica quais estão performando, saturados ou inexplorados.

**As 6 Categorias de Ângulo (Hormozi):**

| # | Categoria | Descrição | Exemplo Shopee ADS |
|---|-----------|-----------|-------------------|
| 1 | Dor | Lidera com o problema/frustração | "Cansou de gastar com ADS sem retorno?" |
| 2 | Resultado | Lidera com prova/outcomes | "R$47K em 30 dias usando ADS na Shopee" |
| 3 | Mecanismo | Lidera com o método único | "O Método TRIA que os top sellers usam" |
| 4 | Identidade | Lidera com quem é o público | "Se você vende na Shopee, isso é pra você" |
| 5 | Contrarian | Desafia sabedoria convencional | "Pare de otimizar seus ADS — faça isso ao invés" |
| 6 | História | Transformação pessoal/aluno | "Ele saiu do zero e faturou R$200K em 4 meses" |

**Sub-ângulos por dor/desejo/objeção:**
```
DORES:
├── Gasto sem retorno
├── Não sabe configurar ADS
├── Concorrente vendendo mais
├── Medo de perder dinheiro
├── Confusão com métricas
└── Já tentou e não funcionou

DESEJOS:
├── Faturar R$10K+/mês
├── Liberdade financeira
├── Escalar sem trabalhar mais
├── Ter um sistema automático
├── Superar concorrentes
└── Viver de e-commerce

OBJEÇÕES:
├── "Não tenho dinheiro pra investir em ADS"
├── "Já tentei e não funcionou"
├── "Não entendo de tecnologia"
├── "Meu nicho é muito competitivo"
├── "ADS na Shopee não funciona"
└── "Não tenho tempo"
```

**Processo de mapeamento semanal:**
1. Listar todos os ângulos ativos (em ads rodando)
2. Associar cada ângulo ao seu resultado (CPA, CTR, Hook Rate)
3. Classificar: Winner / Neutro / Loser / Saturado
4. Identificar gaps: quais categorias/sub-ângulos ainda não testamos?
5. Priorizar 3-5 ângulos inexplorados para a próxima semana
6. Gerar 5 hooks por ângulo priorizado (sistema 6x5)

---

### 6. Roteiro & Direção Criativa
**Nível:** Core
**O que faz:** Gera roteiros completos prontos para gravar, com direção de cenário, formato e performance.

**Processo de criação de roteiro:**
1. Definir ângulo + nível de consciência do público
2. Aplicar RMBC: pesquisa → mecanismo → brief → copy
3. Estruturar em PRSA com timecodes
4. Integrar demo/prova dentro da narrativa (Harmon Brothers)
5. Mapear gatilhos Cialdini a ativar em cada bloco
6. Verificar Value Equation (4 variáveis tocadas?)
7. Adicionar marcações de direção criativa

**Template de roteiro completo:**
```
═══════════════════════════════════════════════
ROTEIRO #{número} — {nome do ângulo}
═══════════════════════════════════════════════

METADADOS:
- Ângulo: {categoria Hormozi}
- Nível consciência: {Schwartz}
- Mecanismo Único: {nome}
- Duração alvo: {Xs}
- Formato: {talking head / screen / B-roll / misto}
- Cenário: {descrição do ambiente}

GATILHOS CIALDINI PLANEJADOS:
- Hook: {princípios}
- Corpo: {princípios}
- CTA: {princípios}

VALUE EQUATION CHECK:
☐ Resultado Desejado | ☐ Probabilidade | ☐ Tempo | ☐ Esforço

═══════════════════════════════════════════════

[0-3s] 🎬 HOOK
Texto na tela: "{TEXTO BOLD EM CAPS}"
Direção: {olhar pra câmera, tom X, energia Y}
Copy: "{fala exata}"

[3-{X}s] 📌 PROBLEMA
Direção: {expressão facial, gesto, tom}
Copy: "{fala exata}"
Visual: {o que aparece na tela}

[{X}-{Y}s] 🏆 RESULTADO
Direção: {mudança de tom, mais animado}
Copy: "{fala exata}"
Prova: {print/screenshot/depoimento a mostrar}

[{Y}-{Z}s] 🔧 SOLUÇÃO
Direção: {tom de professor, confiante}
Copy: "{fala exata}"
Demo: {o que demonstrar na tela}

[{Z}s-fim] 👉 CTA
Direção: {olhar direto, urgente mas acessível}
Copy: "{fala exata}"
Texto na tela: "{CTA final}"

═══════════════════════════════════════════════
NOTAS DE PRODUÇÃO:
- Iluminação: {natural / ring light / softbox}
- Audio: {mic lapela / shotgun / câmera}
- Edição: {cortes rápidos / contínuo / B-roll}
- Pattern interrupts a cada: {3-5s}
═══════════════════════════════════════════════
```

**Direção de cenário por formato:**
| Formato | Quando Usar | Cenário Ideal |
|---------|-------------|---------------|
| Talking Head | Conexão pessoal, autoridade | Home office limpo, boa iluminação |
| Screen Capture | Prova de resultado, demo | Dashboard Shopee, prints |
| B-Roll + Voz | Storytelling, lifestyle | Montagem de imagens + narração |
| Misto | Máxima retenção | Alternar talking head + screen + B-roll |
| UGC Style | Prova social, autenticidade | Celular, ambiente casual |

**Frankensteining (Harmon Brothers):**
Quando gerando múltiplas versões de roteiro:
1. Gerar 3-5 versões independentes do mesmo ângulo
2. Extrair o melhor hook, melhor bloco P, R, S, A de cada versão
3. Montar um "Frankenstein" combinando os melhores blocos
4. Resultado: um roteiro que tem o melhor de cada versão

---

### 7. Relatórios & PDF
**Nível:** Output
**O que faz:** Gera relatórios semanais e PDFs com copies prontas para gravar.

**Relatório semanal contém:**
1. **Resumo executivo**: winners, melhor criativo, pior retenção
2. **Tabela de winners**: métricas de todos os top performers
3. **Análise de retenção**: curva de queda por criativo
4. **PRSA Score**: análise da copy de cada winner
5. **Ângulos**: mapa de testados vs. inexplorados
6. **Tendências**: o que mudou vs. semana passada
7. **Copies geradas**: 3-5 novas copies prontas (PRSA completo)
8. **Recomendações**: próximos passos priorizados

**PDF de copies prontas contém:**
1. Capa com data e resumo
2. Uma página por copy com roteiro completo
3. Marcações PRSA visuais (cores por bloco)
4. Notas de direção criativa
5. Sugestões de cenário e formato

---

### 8. Inteligência Criativa
**Nível:** Estratégico
**O que faz:** Análise de tendências, concorrentes e oportunidades no ecossistema criativo.

**Dimensões analisadas:**

**A. Tendências de Formato**
- Qual formato está gerando melhor retenção? (talking head, screen, misto)
- Duração ideal dos winners está mudando?
- Novos formatos emergentes (carousel video, antes/depois, POV)?

**B. Análise de Concorrentes (Ad Library)**
- Quais ângulos os concorrentes estão usando?
- Quais formatos de vídeo?
- Quais hooks?
- Há gaps que ninguém está atacando?

**C. Biblioteca de CTAs**
- Manter registro de todos os CTAs testados + performance
- Identificar padrões: qual tipo de CTA converte melhor?
- Direto ("Clica no link") vs. Soft ("Veja mais") vs. Urgente ("Últimas vagas")

**D. Correlação Formato x Retenção**
| Formato | Avg Hook Rate | Avg Hold 50% | Avg CTR | Observação |
|---------|--------------|-------------|---------|------------|
| Talking Head | {dados} | {dados} | {dados} | {insight} |
| Screen Capture | {dados} | {dados} | {dados} | {insight} |
| B-Roll + Voz | {dados} | {dados} | {dados} | {insight} |
| Misto | {dados} | {dados} | {dados} | {insight} |
| UGC | {dados} | {dados} | {dados} | {insight} |

Tabela atualizada semanalmente com dados reais dos criativos ativos.

---

## Régua de Qualidade

### O que define um "Winner" para análise?
- CPA abaixo do target OU
- Top 20% por CPA entre todos ativos OU
- Hook Rate >= 30% E CTR >= 1.5%

### Score mínimo para copy gerada
- PRSA Score total >= 7/10
- Todos os blocos >= 5/10 (nenhum bloco fraco)
- Value Equation: todas 4 variáveis tocadas
- Mínimo 3 princípios Cialdini ativos
- Mecanismo Único presente e nomeado
- Hook funciona sem som (texto na tela)

### Validação antes de entregar
- [ ] Copy segue estrutura PRSA com timecodes?
- [ ] Mecanismo Único está presente e nomeado?
- [ ] Value Equation: 4 variáveis tocadas?
- [ ] Mínimo 3 gatilhos Cialdini ativos?
- [ ] Hook funciona em 3 segundos?
- [ ] Texto na tela em todos os momentos-chave?
- [ ] Linguagem do público (não do expert)?
- [ ] CTA único e claro?
- [ ] Escassez real (se aplicável)?
- [ ] Direção de cenário/formato incluída?
