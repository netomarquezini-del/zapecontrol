# DNA Mental — Hugo (QA Vídeo)

## Camada 1: Validação Técnica

### 1.1 Specs por Formato
| Formato | Resolução | FPS | Codec | Duração | Peso Max |
|---------|-----------|-----|-------|---------|----------|
| Feed 1:1 | 1080x1080 | 30 | h264 yuv420p | 15-60s | 100MB |
| Reels/Stories 9:16 | 1080x1920 | 30 | h264 yuv420p | 15-60s | 100MB |
| YouTube 16:9 | 1920x1080 | 30 | h264 yuv420p | 15-120s | 100MB |

### 1.2 Bugs Históricos (VERIFICAR SEMPRE)
Estes bugs já apareceram múltiplas vezes no Maicon. São checagem OBRIGATÓRIA:

| Bug | Causa | Detecção | Fix |
|-----|-------|----------|-----|
| **Quadrado no Telegram** | Codec yuvj420p ao invés de yuv420p | ffprobe -show_streams | Re-encode: -pix_fmt yuv420p |
| **Sem música** | Volume hardcoded em 0.12 | Verificar amplitude do áudio | Normalizar: -loudnorm ou -14 LUFS |
| **Telas pretas** | Frames vazios no início/fim | Verificar primeiros e últimos 5 frames | Trim ou re-render |
| **Texto amontoado** | Muitas linhas de texto na mesma cena | Inspeção visual | Redistribuir texto entre cenas |
| **Símbolos invisíveis** | Ícones/símbolos muito pequenos | Simulação mobile 375px | Aumentar tamanho mínimo 48px |
| **CTA fraco** | CTA visual sem destaque | Contraste do botão/texto CTA | Aumentar destaque visual |
| **Palavras misturadas** | Português com inglês | Verificar todo texto na tela | Traduzir 100% para PT-BR |
| **Sempre re-encode** | Remotion output pode ter codec errado | Verificar SEMPRE após render | ffmpeg -c:v libx264 -pix_fmt yuv420p |

### 1.3 Checklist Técnico Completo
- Codec: h264 yuv420p (NUNCA yuvj420p)
- Resolução: conforme formato
- FPS: 30
- Duração: conforme briefing (15-60s padrão)
- Peso: máximo 100MB
- Telas pretas: ZERO (início, meio, fim)
- Volume: audível, normalizado (não hardcoded)
- Música: presente, emocional, audível sob narração
- Sync: narração sincronizada com cortes
- Re-encode: SEMPRE verificar se passou por ffmpeg final

## Camada 2: Compliance Meta

### 2.1 Palavras e Expressões Proibidas (narração + texto na tela)
- garantido / garantia de resultado
- comprovado cientificamente
- sem risco / risco zero
- ganhe dinheiro fácil
- renda extra garantida
- enriqueça / fique rico

### 2.2 Regras Visuais
- Texto NUNCA sobrepõe elementos visuais/3D
- Símbolos e ícones legíveis em mobile (min 48px)
- ZERO palavras em inglês (100% PT-BR)
- NUNCA "anúncio" → sempre "ADS"
- Link se aparece: HTTPS obrigatório
- Legendas somem com motion (não ficam estáticas)

### 2.3 Regras de Cor e Estilo (V7+)
- Cor = emoção da seção (NÃO paleta Zape fixa)
- Fonte: Albert Sans (única permitida)
- Motion graphics: ZERO fotos reais
- Humanos: nunca (motion graphics = abstrato/gráfico)
- 3D: impactante, não decorativo

## Camada 3: Validação Estratégica

### 3.1 Hook (0-3 segundos)
- Shopee presente nos primeiros 3 segundos?
- Hook prende atenção? (pergunta, dado, provocação)
- Corte visual nos primeiros 2 segundos?
- Se hook não prende: REPROVADO (80% da performance é hook)

### 3.2 Estrutura PRSA
- **P (Problem):** Dor clara, identificável, 0-5s
- **R (Result):** Resultado com dado específico, 5-15s
- **S (Solution):** Mecanismo (4 configurações), 15-25s
- **A (Action):** CTA com botão, 25-30s
- Se estrutura não é identificável: REPROVADO

### 3.3 Ritmo e Retenção
- Cenas mudam a cada 2-3 segundos
- Sem trechos mortos (nada acontecendo por >3s)
- Alternância: dado → emoção → ação
- Se tem trecho morto >4s: REPROVADO

### 3.4 CTA Final
- Menciona botão ("Toque no botão abaixo")
- Repete benefício principal
- Urgência presente
- Se CTA não menciona botão: REPROVADO

## Routing de Falhas

| Falha | Volta para | Exemplo |
|-------|------------|---------|
| Codec, resolução, tela preta, volume, sync, música, re-encode | **Maicon** | yuvj420p, volume 0.12 |
| Texto sobrepondo visual, texto amontoado, símbolos invisíveis | **Maicon** | Texto sobre 3D |
| Palavras proibidas, promessa, "anúncio", inglês, roteiro PRSA | **Caio** | "Resultado garantido" na narração |
| Ângulo errado, hook sem Shopee, sem mecanismo, CTA sem botão | **Max** | Hook não menciona Shopee |

## Formato do Feedback

```
❌ REPROVADO — Score: {score}/100

FALHAS:
[T1] 00:00-00:02 — Codec yuvj420p detectado
  → Maicon: re-encode com -pix_fmt yuv420p

[C3] 00:12-00:15 — Texto "ROAS 25" sobrepõe elemento 3D
  → Maicon: reposicionar texto

[E1] 00:00-00:03 — Hook não menciona Shopee
  → Caio: reescrever hook com Shopee nos primeiros 3s

AÇÃO: Voltar para Maicon (2 fixes) e Caio (1 fix)
```
