# Skill Tree — Vitor (QA Estático)

## Tier 1: Auditoria Técnica (Automatizável)

### S1: Validação de Specs de Imagem
- **Como executa:** Lê metadados da imagem (dimensão, formato, peso, color profile)
- **Ferramentas:** ffprobe, identify (ImageMagick), ou leitura direta do arquivo
- **Checklist:**
  - [ ] Dimensão exata (1080x1080 feed, 1080x1350 vertical, 1080x1920 stories)
  - [ ] Formato: PNG ou JPG
  - [ ] Peso: <= 5MB
  - [ ] Color profile: sRGB (evitar CMYK que distorce cores na Meta)
- **Output:** PASS/FAIL com dados exatos ("1080x1080 ✅" ou "1200x1200 ❌ — esperado 1080x1080")
- **Responsável em caso de falha:** Thomas

### S2: Validação de Texto na Imagem
- **Como executa:** Análise visual da proporção texto/imagem
- **Método:** Estimar área ocupada por texto vs área total
- **Referência:** Meta recomenda < 20% de texto. Acima disso, alcance reduzido
- **Checklist:**
  - [ ] Texto ocupa < 20% da área
  - [ ] Texto legível em simulação mobile 375px
  - [ ] Fonte é Albert Sans
  - [ ] Nenhum texto cortado nas bordas
  - [ ] Hierarquia clara: headline > body > CTA (por tamanho/peso visual)
- **Output:** PASS/FAIL com estimativa ("~15% texto ✅" ou "~35% texto ❌ — reduzir headline ou corpo")
- **Responsável em caso de falha:** Thomas

### S3: Validação de Hierarquia Visual
- **Como executa:** Análise da composição visual seguindo princípios do Thomas DNA
- **Método:** Verificar se os 3 elementos max estão presentes e em ordem
- **Checklist:**
  - [ ] Máximo 3 elementos principais (headline + prova + CTA)
  - [ ] CTA é o elemento de maior contraste
  - [ ] Headline é o elemento mais proeminente (tamanho)
  - [ ] Olhar humano (se presente) direciona para headline ou CTA, nunca para câmera
  - [ ] Espaço negativo adequado (não está amontoado)
  - [ ] Não tem botão fake (Meta reprova)
- **Base de conhecimento:** Thomas DNA — Grunt Test (Miller), Von Restorff, Gaze Cueing, Attention Ratio (Oli Gardner)
- **Responsável em caso de falha:** Thomas

## Tier 2: Auditoria de Compliance (Baseada em KB)

### S4: Validação de Copy Compliance
- **Como executa:** Lê todo texto do criativo e cruza com lista de regras
- **Base de conhecimento:** Meta Policy KB (`/squads/growth/data/meta-policy-kb.md`) + regras Zape
- **Checklist:**
  - [ ] Zero palavras proibidas (garantido, comprovado, sem risco, etc.)
  - [ ] Promessas dentro do permitido (ROAS 25 como referência, não garantia)
  - [ ] NUNCA "anúncio" → sempre "ADS"
  - [ ] Link correto: https://zapeecomm.com/curso-ads/
  - [ ] Link é HTTPS (nunca HTTP)
  - [ ] Sem claims de saúde ou transformação física
  - [ ] Sem discriminação de características pessoais
  - [ ] Sem conteúdo sensacionalista extremo
  - [ ] Shopee mencionada sem violar guidelines da marca
- **Output:** PASS/FAIL com citação exata do trecho problemático
- **Responsável em caso de falha:** Rita (copywriter-estatico)

### S5: Validação de Elementos Visuais Compliance
- **Como executa:** Análise visual de elementos que a Meta pode reprovar
- **Checklist:**
  - [ ] Sem fake UI (botão play falso, notificação falsa, interface falsa)
  - [ ] Sem antes/depois proibido (transformação corporal)
  - [ ] Sem conteúdo sexualizado ou violento
  - [ ] Logo Shopee usado conforme guidelines
  - [ ] Sem texto que simule interação ("Clique aqui" com seta no botão fake)
- **Base de conhecimento:** Meta Policy KB + Thomas DNA (regras de design)
- **Responsável em caso de falha:** Thomas

## Tier 3: Auditoria Estratégica (Análise de Qualidade)

### S6: Grunt Test — Compreensão em 3 Segundos
- **Como executa:** Simula primeiro contato. Em 3 segundos de exposição, responde:
  1. **O que é?** → Deve ser claro que é curso de Shopee ADS
  2. **Como me ajuda?** → Deve mostrar resultado (ROAS 25, mais vendas)
  3. **O que faço?** → CTA deve ser óbvio
- **Método:** Olhar rápido → se precisa "ler com atenção" para entender, FALHOU
- **Base de conhecimento:** Donald Miller (StoryBrand), Oli Gardner (Conversion-Centered Design)
- **Scoring:**
  - 3/3 respostas óbvias: PASS (100)
  - 2/3: WARN (60) — precisa ajuste
  - 1/3 ou menos: FAIL (30) — refazer
- **Responsável em caso de falha:** Thomas (se layout confuso) ou Rita (se copy confusa) ou Max (se ângulo errado)

### S7: Validação de Ângulo vs Briefing
- **Como executa:** Compara o criativo final com o briefing original do Max
- **Checklist:**
  - [ ] Ângulo do criativo bate com ângulo do briefing (dor, resultado, mecanismo, prova social, curiosidade, contraste, urgência)
  - [ ] Público-alvo correto (linguagem adequada pro seller)
  - [ ] Mecanismo único presente (4 configurações Shopee ADS)
  - [ ] Promessa presente (ROAS 25)
  - [ ] Tom de voz coerente com ângulo (urgente, empático, provocativo, etc.)
- **Base de conhecimento:** Max DNA — ângulos validados, regras de copy
- **Responsável em caso de falha:** Max (se briefing ambíguo) ou Rita (se copy divergiu do briefing)

### S8: Thumb-Stop Score
- **Como executa:** Avalia potencial de parar o scroll no feed
- **Critérios:**
  - Contraste visual forte? (destaca no feed?)
  - Elemento surpresa ou disruptivo? (quebra padrão visual do feed?)
  - Curiosidade ativada? (headline gera "quero saber mais"?)
  - Rosto humano direcionando? (se aplicável)
  - Número grande/específico visível? (R$200K, ROAS 25)
- **Scoring:** 0-100 baseado nos critérios acima
- **Base de conhecimento:** Thomas DNA — Von Restorff (efeito isolamento), Barry Hott (ugly ads), neurociência de atenção
- **Responsável em caso de falha:** Thomas

## Tier 4: Relatório e Routing

### S9: Geração de Relatório QA
- **Como executa:** Consolida resultados das 3 camadas em relatório estruturado
- **Output:**
  ```
  ═══ QA REPORT — Criativo Estático ═══

  Score Final: {score}/100
  Camada 1 (Técnico):    {score_t}/100 — {n_falhas} falha(s)
  Camada 2 (Compliance): {score_c}/100 — {n_falhas} falha(s)
  Camada 3 (Estratégia): {score_e}/100 — {n_falhas} falha(s)

  Veredicto: ✅ APROVADO / ❌ REPROVADO

  Detalhamento:
  [T1] Dimensão: 1080x1080 ✅
  [T2] Formato: PNG ✅
  [C1] Palavras proibidas: nenhuma ✅
  [C7] Padrão ADS: "ADS" usado corretamente ✅
  [E1] Grunt Test: 3/3 ✅
  ...

  Falhas (se houver):
  [ID] Descrição → Responsável: {agente} — Ação: {correção}
  ```

### S10: Routing Inteligente de Falhas
- **Como executa:** Analisa cada falha e roteia para o agente correto
- **Regras de routing:**
  | Tipo de falha | Agente | Prioridade |
  |---------------|--------|------------|
  | Specs (dimensão, formato, peso) | Thomas | Alta |
  | Visual (hierarquia, contraste, fonte) | Thomas | Média |
  | Texto (compliance, palavras, link) | Rita | Alta |
  | Estratégia (ângulo, briefing) | Max | Média |
  | Múltiplas camadas | Priorizar técnico > compliance > estratégia | — |
- **Output:** Lista de ações por agente, ordenada por prioridade
