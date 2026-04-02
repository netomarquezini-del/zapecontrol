# Prompt Master — Criativo Certo vs Errado

Este prompt gera o criativo SEM imagem de referência. Cada detalhe visual está descrito.

---

## Prompt Template (copiar e preencher variáveis)

```
Crie uma imagem vertical de anúncio comparativo para redes sociais.

=== DIMENSÕES E FORMATO ===
- Quadrado (1024x1024px — padrão Gemini)
- Imagem estática, sem animação
- Estilo flat design moderno, limpo, profissional
- Resolução alta, nítida

=== ESTRUTURA GERAL ===
A imagem é dividida em 3 zonas verticais:

ZONA 1 — HEADLINE (topo, ~15% da altura)
- Faixa horizontal no topo ocupando toda a largura
- Fundo: preto sólido (#000000)
- Texto centralizado: "{headline}"
- Texto branco (#FFFFFF), bold, uppercase, sans-serif
- Tamanho grande e impactante, máximo 2 linhas

ZONA 2 + ZONA 3 — SPLIT COMPARATIVO (~85% restante da altura)
Dividido ao meio verticalmente em dois lados:

LADO ESQUERDO (50% da largura) — "JEITO ERRADO"
- Fundo: preto (#000000) com gradiente vermelho ({cor_errado})
- O gradiente vermelho vem da borda esquerda (intensidade ~30-40%) e vai desvanecendo em direção ao centro
- Efeito de "glow" vermelho sutil na borda esquerda
- No topo deste lado: ícone ❌ grande (vermelho) + texto "JEITO ERRADO" em vermelho, bold, uppercase
- Abaixo, 4 itens listados verticalmente, cada um com:
  - Ícone ❌ menor em vermelho à esquerda
  - Texto branco (#FFFFFF), bold, sans-serif
  - Espaçamento generoso entre itens (~32px)

LADO DIREITO (50% da largura) — "JEITO CERTO"
- Fundo: preto (#000000) com gradiente azul ({cor_certo})
- O gradiente azul vem da borda direita (intensidade ~30-40%) e vai desvanecendo em direção ao centro
- Efeito de "glow" azul sutil na borda direita
- No topo deste lado: ícone ✅ grande (azul brilhante) + texto "JEITO CERTO" em azul brilhante, bold, uppercase
- O ícone ✅ tem um efeito de brilho/glow azul neon sutil ao redor
- Abaixo, 4 itens listados verticalmente, cada um com:
  - Ícone ✅ menor em azul à esquerda
  - Texto branco (#FFFFFF), bold, sans-serif
  - Espaçamento generoso entre itens (~32px)

DIVISOR CENTRAL
- NÃO é uma linha sólida
- É a transição natural onde o gradiente vermelho (esquerda) encontra o gradiente azul (direita)
- No centro, o fundo é quase preto puro, com os dois gradientes se dissipando

=== TIPOGRAFIA ===
- Fonte: sans-serif bold/black (estilo similar a Montserrat Bold, Inter Black, ou Albert Sans)
- Headline: tamanho grande (~40px equivalente), bold, branca, uppercase, centralizada
- Títulos "JEITO ERRADO" e "JEITO CERTO": tamanho grande (~48-56px equivalente), bold, cor do lado, uppercase
- Itens: tamanho médio (~32-36px equivalente), bold, branca
- Todo texto deve ser 100% LEGÍVEL, sem distorção, sem erros de ortografia
- Todo texto em PORTUGUÊS BRASILEIRO — acentos corretos (ã, ç, é, etc.)

=== ÍCONES ===
- ❌ (X) do lado errado: estilo bold, cor vermelha, sem borda
- ✅ (check/tick) do lado certo: estilo bold, cor azul brilhante, com leve glow/brilho neon
- Os ícones ✅ do lado certo são mais brilhantes/luminosos que os ❌ do lado errado
- Ícones dos títulos: tamanho grande (~48px)
- Ícones dos itens: tamanho menor (~28px), alinhados à esquerda do texto

=== CORES EXATAS ===
- Fundo base: preto (#000000)
- Gradiente esquerdo: vermelho ({cor_errado}) com intensidade ~30-40%
- Gradiente direito: azul ({cor_certo}) com intensidade ~30-40%
- Texto dos títulos errado: vermelho ({cor_errado})
- Texto dos títulos certo: azul ({cor_certo})
- Texto dos itens: branco (#FFFFFF) em ambos os lados
- Headline: branco (#FFFFFF)

=== CONTEÚDO (escreva EXATAMENTE estas palavras, sem alterar) ===

HEADLINE:
{headline}

LADO ESQUERDO — ❌ JEITO ERRADO:
❌ {item_errado_1}
❌ {item_errado_2}
❌ {item_errado_3}
❌ {item_errado_4}

LADO DIREITO — ✅ JEITO CERTO:
✅ {item_certo_1}
✅ {item_certo_2}
✅ {item_certo_3}
✅ {item_certo_4}

=== O QUE NÃO INCLUIR ===
- NÃO adicionar logo, marca d'água, ou branding
- NÃO adicionar botões, CTAs, ou links
- NÃO adicionar bordas ao redor da imagem
- NÃO adicionar sombras nos textos (drop shadow)
- NÃO adicionar imagens, fotos, ou ilustrações
- NÃO adicionar elementos decorativos extras
- NÃO mudar as palavras — escrever EXATAMENTE o que está acima
- NÃO usar fontes serifadas ou cursivas
- NÃO usar texto em inglês

=== PRIORIDADE MÁXIMA ===
1. Texto PRECISA estar 100% correto — sem erros de ortografia, sem letras trocadas, sem palavras inventadas
2. Layout split 50/50 com gradientes vermelho e azul
3. Hierarquia visual clara: headline > títulos > itens
4. Legível em tela de celular (375px de largura)
```

---

## Variáveis do Prompt

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{headline}` | Frase contextualizadora no topo | "4 ERROS QUE MATAM SEU SHOPEE ADS" |
| `{cor_errado}` | Cor do lado errado | vermelho / #EF4444 |
| `{cor_certo}` | Cor do lado certo | azul / #3B82F6 |
| `{item_errado_1-4}` | 4 itens do lado errado | "Vários produtos por campanha" |
| `{item_certo_1-4}` | 4 itens do lado certo | "1 produto por campanha" |

---

## Pares de Cores no Prompt

Substituir `{cor_errado}` e `{cor_certo}` conforme o par:

| Par | No prompt usar |
|-----|---------------|
| Default | "vermelho" e "azul" |
| Sucesso | "vermelho" e "verde" |
| Zape | "vermelho" e "verde lima" |
| Sutil | "cinza escuro" e "azul" |
| Alerta | "laranja" e "azul" |
| Dinheiro | "vermelho" e "dourado/amarelo ouro" |

---

## Dicas para Melhorar Resultado

1. **Texto curto nos itens** — máximo 3-4 palavras por item reduz chance de erro
2. **Uppercase nos títulos** — Gemini erra menos em uppercase
3. **Repetir as palavras** — colocar o texto no prompt 2x (uma na seção de conteúdo, outra na seção de prioridade)
4. **Enfatizar ortografia** — sempre incluir "sem erros de ortografia" e "EXATAMENTE estas palavras"
5. **Evitar parênteses nos itens** — "(rasgando dinheiro)" pode confundir. Usar sem parênteses
