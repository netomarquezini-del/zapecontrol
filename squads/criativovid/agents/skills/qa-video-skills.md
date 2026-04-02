# Skill Tree — Hugo (QA Vídeo)

## Tier 1: Auditoria Técnica (Automatizável)

### S1: Validação de Codec e Container
- **Como executa:** Roda ffprobe no vídeo e analisa streams
- **Comando:** `ffprobe -v quiet -print_format json -show_streams {video}`
- **Checklist:**
  - [ ] Codec vídeo: h264 (NUNCA h265 ou outros)
  - [ ] Pixel format: yuv420p (NUNCA yuvj420p — causa quadrado no Telegram)
  - [ ] Container: mp4
  - [ ] FPS: 30
  - [ ] Resolução: conforme formato (1080x1080, 1080x1920, 1920x1080)
- **Output:** PASS/FAIL com dados do ffprobe
- **Bug histórico:** Remotion pode outputar yuvj420p. SEMPRE verificar
- **Fix padrão:** `ffmpeg -i input.mp4 -c:v libx264 -pix_fmt yuv420p -c:a copy output.mp4`
- **Responsável em caso de falha:** Maicon

### S2: Validação de Áudio
- **Como executa:** Analisa tracks de áudio do vídeo
- **Comando:** `ffprobe -v quiet -print_format json -show_streams -select_streams a {video}`
- **Checklist:**
  - [ ] Áudio presente (tem stream de áudio)
  - [ ] Codec áudio: aac
  - [ ] Sample rate: 44100 ou 48000
  - [ ] Volume percebido adequado (NUNCA hardcoded em 0.12)
  - [ ] Narração audível e clara
  - [ ] Música de fundo presente e audível (não ausente, não muito alta)
  - [ ] Sync: narração sincronizada com cortes visuais (sem delay)
- **Método de volume:** Verificar loudness com `ffmpeg -i input.mp4 -af loudnorm=print_format=summary -f null -`
  - Alvo: -14 LUFS (padrão broadcast)
  - Abaixo de -24 LUFS: volume muito baixo ❌
  - Acima de -8 LUFS: volume muito alto ❌
- **Bug histórico:** Volume hardcoded em 0.12 (praticamente mudo)
- **Responsável em caso de falha:** Maicon

### S3: Validação de Frames
- **Como executa:** Verifica integridade visual do vídeo
- **Checklist:**
  - [ ] ZERO telas pretas no início (primeiros 5 frames)
  - [ ] ZERO telas pretas no meio (sampling a cada 2s)
  - [ ] ZERO telas pretas no fim (últimos 5 frames)
  - [ ] ZERO frames congelados por mais de 1s (exceto se intencional)
  - [ ] Duração dentro do range (15-60s padrão, 15-120s YouTube)
  - [ ] Peso total: <= 100MB
- **Método:** Extrair frames com `ffmpeg -i input.mp4 -vf "select=not(mod(n\,60))" -vsync vfr frame_%04d.png` e verificar se algum é preto
- **Bug histórico:** Telas pretas no início/fim do Remotion render
- **Responsável em caso de falha:** Maicon

### S4: Validação de Ritmo de Cortes
- **Como executa:** Analisa transições e mudanças visuais
- **Método:** Detectar mudanças significativas entre frames (scene change detection)
- **Checklist:**
  - [ ] Corte/transição a cada 2-3 segundos (regra Maicon)
  - [ ] Sem trechos mortos (nada muda por >4 segundos)
  - [ ] Transições suaves (sem corte abrupto não-intencional)
  - [ ] Primeiro corte acontece nos primeiros 2 segundos (retenção)
- **Scoring:**
  - Média de 2-3s entre cortes: PASS (100)
  - Média de 3-5s: WARN (60)
  - Algum trecho >6s sem mudança: FAIL (30)
- **Base de conhecimento:** Maicon DNA — neurodesign, retenção visual
- **Responsável em caso de falha:** Maicon

## Tier 2: Auditoria de Compliance (Baseada em KB)

### S5: Validação de Texto na Tela
- **Como executa:** Analisa cada cena onde aparece texto sobreposto
- **Checklist:**
  - [ ] Texto NUNCA sobrepõe elementos visuais/3D
  - [ ] Texto centralizado quando deve ser centralizado
  - [ ] Legendas somem com motion (não ficam estáticas)
  - [ ] Texto grande e legível em mobile (375px)
  - [ ] Fonte: Albert Sans (única permitida)
  - [ ] Zero palavras em inglês (100% PT-BR)
  - [ ] NUNCA "anúncio" → sempre "ADS"
  - [ ] Símbolos/ícones legíveis (mínimo 48px)
- **Bug histórico:** Texto amontoado, símbolos invisíveis, palavras misturadas PT/EN
- **Responsável em caso de falha:** Maicon (posição/tamanho) ou Caio (conteúdo do texto)

### S6: Validação de Narração Compliance
- **Como executa:** Ouve/analisa o texto narrado no vídeo
- **Base de conhecimento:** Meta Policy KB + regras Zape
- **Checklist:**
  - [ ] Zero palavras proibidas na narração (garantido, comprovado, sem risco, etc.)
  - [ ] Promessas dentro do permitido (ROAS 25 como referência, não garantia)
  - [ ] NUNCA "anúncio" falado — sempre "ADS"
  - [ ] Linguagem 100% PT-BR (sem termos em inglês)
  - [ ] Sem claims de saúde ou transformação física
  - [ ] Tom adequado (não agressivo, não enganoso)
  - [ ] Sem inventar palavras ou neologismos
- **Responsável em caso de falha:** Caio (copywriter-video)

### S7: Validação de Estilo Visual
- **Como executa:** Verifica conformidade com Maicon Visual Style Guide
- **Base de conhecimento:** MAICON_VISUAL_STYLE.md
- **Checklist:**
  - [ ] Motion graphics (ZERO fotos reais)
  - [ ] Cor = emoção da seção (NÃO paleta Zape fixa)
  - [ ] 3D impactante, não decorativo
  - [ ] Sem humanos (motion graphics = abstrato/gráfico)
  - [ ] Elementos visuais coerentes entre cenas
- **Responsável em caso de falha:** Maicon

## Tier 3: Auditoria Estratégica (Análise de Qualidade)

### S8: Validação de Hook (0-3 segundos)
- **Como executa:** Analisa os primeiros 3 segundos do vídeo
- **Checklist:**
  - [ ] Shopee mencionada (visual ou narração) nos primeiros 3s
  - [ ] Hook prende atenção (pergunta, dado, provocação, contraste)
  - [ ] Corte visual nos primeiros 2 segundos
  - [ ] Emoção ativada (curiosidade, medo, ganância)
- **Scoring:**
  - Shopee + hook forte + corte visual: PASS (100)
  - Sem Shopee: FAIL (0) — inegociável
  - Hook fraco: WARN (50)
- **Base de conhecimento:** Caio DNA — padrões de hook, Russell Brunson (hook-story-offer)
- **Responsável em caso de falha:** Caio (se hook textual fraco) ou Maicon (se visual fraco)

### S9: Validação de Estrutura PRSA
- **Como executa:** Mapeia o roteiro para as 4 fases PRSA
- **Checklist:**
  - [ ] P (Problem): 0-5s — dor clara, Shopee no hook ✓
  - [ ] R (Result): 5-15s — resultado com dado específico (ROAS 25) ✓
  - [ ] S (Solution): 15-25s — mecanismo (4 configurações) ✓
  - [ ] A (Action): 25-30s — CTA com botão ✓
  - [ ] Transições entre fases são naturais (não abruptas)
  - [ ] Duração de cada fase proporcional
- **Scoring:**
  - 4/4 fases claras: PASS (100)
  - 3/4: WARN (60)
  - 2/4 ou menos: FAIL (30)
- **Base de conhecimento:** Caio DNA — PRSA framework
- **Responsável em caso de falha:** Caio

### S10: Validação de CTA Final
- **Como executa:** Analisa os últimos 5 segundos do vídeo
- **Checklist:**
  - [ ] CTA presente e claro
  - [ ] Menciona botão ("Toque no botão abaixo" ou similar)
  - [ ] Repete benefício principal antes do CTA
  - [ ] Urgência presente (tempo, vagas, oportunidade)
  - [ ] Destaque visual do CTA (cor, tamanho, animação)
- **Scoring:**
  - Botão + benefício + urgência + destaque: PASS (100)
  - Sem menção a botão: FAIL (40) — regra inegociável
  - CTA fraco/genérico: WARN (60)
- **Base de conhecimento:** Caio DNA — regras de CTA, Maicon DNA — composição CTA
- **Responsável em caso de falha:** Caio (texto) ou Maicon (visual)

### S11: Validação de Ângulo vs Briefing
- **Como executa:** Compara vídeo final com briefing do Max
- **Checklist:**
  - [ ] Ângulo do vídeo bate com ângulo do briefing
  - [ ] Mecanismo único presente (4 configurações)
  - [ ] Promessa presente (ROAS 25)
  - [ ] Tom de voz coerente com ângulo
  - [ ] Público-alvo correto (linguagem de seller)
- **Responsável em caso de falha:** Max (briefing) ou Caio (roteiro divergiu)

## Tier 4: Relatório e Routing

### S12: Geração de Relatório QA com Timestamps
- **Como executa:** Consolida resultados com timestamps exatos dos problemas
- **Output:**
  ```
  ═══ QA REPORT — Vídeo Ad ═══

  Score Final: {score}/100
  Camada 1 (Técnico):    {score_t}/100 — {n_falhas} falha(s)
  Camada 2 (Compliance): {score_c}/100 — {n_falhas} falha(s)
  Camada 3 (Estratégia): {score_e}/100 — {n_falhas} falha(s)

  Specs: {resolução} | {codec} | {fps}fps | {duração}s | {peso}MB
  Áudio: {codec_audio} | {sample_rate}Hz | {loudness} LUFS

  Veredicto: ✅ APROVADO / ❌ REPROVADO

  Detalhamento:
  [T1] 00:00 Codec: h264 yuv420p ✅
  [T5] 00:00 Volume: -14 LUFS ✅
  [C5] 00:08 Texto "ADS" usado ✅
  [E1] 00:00-00:03 Hook: Shopee presente ✅
  ...

  Falhas (se houver):
  [ID] {timestamp} Descrição → Responsável: {agente} — Ação: {correção}
  ```

### S13: Routing Inteligente de Falhas
- **Como executa:** Analisa cada falha e roteia para o agente correto
- **Regras de routing:**
  | Tipo de falha | Agente | Prioridade |
  |---------------|--------|------------|
  | Codec, resolução, frames, áudio | Maicon | Crítica |
  | Texto visual (posição, tamanho, fonte) | Maicon | Alta |
  | Narração (compliance, palavras) | Caio | Alta |
  | Roteiro (PRSA, hook, CTA) | Caio | Média |
  | Estratégia (ângulo, briefing) | Max | Média |
  | Bugs históricos (yuvj420p, vol 0.12, tela preta) | Maicon | Crítica |
- **Prioridade de fix:** Crítica (bloqueia) > Alta (deve corrigir) > Média (recomendado)
- **Output:** Lista de ações por agente com timestamps, ordenada por prioridade
