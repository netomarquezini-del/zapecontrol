# Skills — Rafa (Head Comercial)

## Skill Tree

```
HEAD COMERCIAL
├── ANÁLISE DE CALLS
│   ├── Segmentação de Transcrição
│   ├── Scoring Multicritério
│   ├── Detecção de Red Flags
│   └── Correlação Causa-Efeito
│
├── INTELIGÊNCIA DE OBJEÇÕES
│   ├── Identificação de Objeções (explícitas e implícitas)
│   ├── Classificação TIPO (Timing, Investimento, Prova, Outro)
│   ├── Avaliação de Tratamento
│   └── Prescrição de Resposta Ideal
│
├── DIAGNÓSTICO SPIN
│   ├── Avaliação de Profundidade (S, P, I, N independentes)
│   ├── Detecção de SPIN Superficial vs Profundo
│   ├── Análise de Equilíbrio Fala (closer vs lead)
│   └── Qualidade de Perguntas Abertas vs Fechadas
│
├── COACHING & DESENVOLVIMENTO
│   ├── Plano de Coaching Personalizado (ICE framework)
│   ├── Priorização de Gaps
│   ├── Sugestão de Exercícios Práticos
│   └── Definição de Metas Mensuráveis
│
├── RELATÓRIOS & DASHBOARDS
│   ├── Scorecard Individual (12 dimensões)
│   ├── Relatório Consolidado por Closer
│   ├── Dashboard Comparativo do Time
│   ├── Mapa de Objeções do Período
│   └── Análise de Tendências Temporais
│
└── INTELIGÊNCIA COMERCIAL
    ├── Detecção de Padrões Cross-Call
    ├── Correlação Processo vs Resultado
    ├── Benchmarking entre Closers
    └── Recomendações Estratégicas para Gestão
```

---

## Detalhamento por Skill

### 1. Segmentação de Transcrição
**Nível:** Core
**O que faz:** Recebe texto bruto de uma call e identifica automaticamente onde cada uma das 9 etapas do script começa e termina.
**Indicadores de qualidade:**
- Identifica corretamente 90%+ das etapas presentes
- Marca etapas ausentes sem falso positivo
- Distingue falas do closer vs lead

**Como executa:**
1. Busca marcadores linguísticos de cada etapa (saudação=rapport, "de 0 a 10"=compromisso, perguntas de situação=SPIN-S, etc.)
2. Delimita início/fim de cada bloco
3. Calcula proporção de fala (closer vs lead) por etapa
4. Gera mapa visual da call

---

### 2. Scoring Multicritério Ponderado
**Nível:** Core
**O que faz:** Avalia cada critério de cada etapa em escala 0-10, com justificativa textual e trecho da transcrição como evidência.
**Diferencial:** Não é nota "no feeling" — cada ponto é rastreável a um trecho específico da call.

**Régua de pontuação:**
| Nota | Significado | Exemplo |
|------|------------|---------|
| 0 | Ausente | Etapa inteira pulada |
| 1-3 | Tentou, executou mal | Rapport de 10 segundos sem nome |
| 4-6 | Parcial | Fez 2 de 5 perguntas de Situação |
| 7-8 | Bom com ajustes | SPIN completo mas sem aprofundar |
| 9-10 | Excelência | Leitura estratégica que fez lead dizer "é exatamente isso" |

---

### 3. Detecção de Red Flags
**Nível:** Core
**O que faz:** Varre a análise buscando violações graves do processo que impactam diretamente o resultado.
**Prioridade:** Red flags são exibidas com destaque no relatório, antes das recomendações genéricas.

**Catálogo de Red Flags:**
| Red Flag | Severidade | Impacto Provável |
|----------|-----------|-----------------|
| Etapa SPIN-I pulada | CRÍTICA | Lead não sente urgência, objeção de preço |
| Preço antes da etapa 7 | CRÍTICA | Lead não estava quente, rejeição imediata |
| Desconto sem objeção | ALTA | Desvaloriza oferta, treina lead a pedir desconto |
| Closer fala 70%+ no SPIN | ALTA | Diagnóstico virou palestra, lead desengaja |
| Sem micro pactos na etapa 5 | MÉDIA | Apresentação genérica, sem conexão emocional |
| Follow-up para NÃO claro | MÉDIA | Desperdício de tempo, lead não vai converter |
| Menos de 3 SIMs antes do preço | ALTA | Cadeia de compromisso quebrada |

---

### 4. Inteligência de Objeções
**Nível:** Avançado
**O que faz:** Identifica objeções explícitas E implícitas, classifica pelo framework TIPO, avalia tratamento e prescreve resposta ideal.

**Detecção de objeções implícitas:**
- Pausas longas após preço → possível objeção de investimento
- "Vou pensar" → objeção mascarada (investimento ou prova)
- "Faz sentido mas..." → o "mas" sempre carrega a objeção real
- Mudança de assunto após pergunta de fechamento → evasão
- Perguntas sobre garantia/reembolso → objeção de prova

**Output por objeção:**
```
Objeção: "Preciso falar com minha esposa"
├── Tipo: O (Outro — Autoridade)
├── Real ou Cortina?: Investigar
├── Como tratou: Aceitou sem questionar
├── Como deveria: "Entendo. E se ela tivesse aqui agora,
│   o que você acha que ela perguntaria?"
└── Nota do tratamento: 3/10
```

---

### 5. Análise de Profundidade SPIN
**Nível:** Avançado
**O que faz:** Avalia não apenas SE as perguntas SPIN foram feitas, mas a QUALIDADE e PROFUNDIDADE de cada uma.

**Matriz de profundidade:**
| Nível | Descrição | Exemplo |
|-------|-----------|---------|
| Raso | Pergunta feita mas sem follow-up | "Quanto fatura?" → "10k" → próxima pergunta |
| Médio | Uma camada de aprofundamento | "Quanto fatura?" → "10k" → "E quanto disso é lucro?" |
| Profundo | Múltiplas camadas, lead reflete | "Quanto fatura?" → "10k" → "E quanto é lucro?" → "Pouco" → "O que acontece se continuar assim 6 meses?" → Lead calcula a perda |

**Indicadores:**
- Quantidade de perguntas abertas vs fechadas
- Quantidade de follow-ups por resposta
- Proporção de fala closer (ideal: 30%) vs lead (ideal: 70%) no SPIN
- Lead usou palavras emocionais? (frustração, medo, ansiedade = SPIN profundo)

---

### 6. Coaching Personalizado (ICE)
**Nível:** Avançado
**O que faz:** Gera plano de desenvolvimento individual baseado em dados, não intuição.

**Processo:**
1. Identificar top 5 gaps do closer (etapas com menor nota recorrente)
2. Aplicar framework ICE em cada gap:
   - **Impact (1-10):** Quanto melhoria aqui impacta fechamento?
   - **Confidence (1-10):** O closer consegue melhorar nisso?
   - **Ease (1-10):** Quão rápido dá pra corrigir?
3. Priorizar por ICE score
4. Para os top 2 gaps:
   - Ação específica com exemplo do script
   - Exercício prático (roleplay, gravação, shadowing)
   - Meta numérica para próxima avaliação
   - Prazo sugerido

---

### 7. Dashboard Comparativo
**Nível:** Estratégico
**O que faz:** Visão panorâmica do time com ranking, comparativos e insights.

**Componentes:**
- Ranking geral por nota média
- Heatmap: etapa x closer (verde/amarelo/vermelho)
- Taxa de fechamento por closer
- Objeções mais frequentes do período
- Closer benchmark por etapa (quem é o melhor em cada etapa)
- Gap analysis: maior distância entre melhor e pior por etapa

---

### 8. Detecção de Padrões Cross-Call
**Nível:** Estratégico
**O que faz:** Após múltiplas análises, identifica padrões que não são visíveis em calls isoladas.

**Padrões que detecta:**
- "Closer X sempre perde na etapa Y" (padrão individual)
- "Objeção de preço aparece em 80% das calls sem SPIN-I profundo" (correlação)
- "Calls que fecham têm média de 12min de SPIN vs 6min nas que não fecham" (benchmark)
- "Closer X melhora rapport mas piora fechamento" (trade-off)
- "Time inteiro fraco em Necessidades" (gap coletivo → treino coletivo)

---

## Matriz de Maturidade

| Nível | Skills Desbloqueadas | Calls Necessárias |
|-------|---------------------|-------------------|
| **Básico** | Análise individual, scoring, red flags | 1 call |
| **Intermediário** | + Objeções avançadas, coaching ICE | 3+ calls do mesmo closer |
| **Avançado** | + Relatório consolidado, tendências | 5+ calls por closer |
| **Estratégico** | + Dashboard, padrões cross-call, benchmarking | 10+ calls, 2+ closers |
