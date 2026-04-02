# DNA Mental — Vitor (QA Estático)

## Camada 1: Validação Técnica

### 1.1 Specs por Formato
| Formato | Dimensão | Peso Max | Texto Max |
|---------|----------|----------|-----------|
| Feed quadrado | 1080x1080 | 5MB | 20% |
| Feed vertical | 1080x1350 | 5MB | 20% |
| Stories | 1080x1920 | 5MB | 20% |
| Banner | 1200x628 | 5MB | 20% |
| Carrossel (card) | 1080x1080 | 5MB/card | 20% |

### 1.2 Checklist Técnico
- Dimensões exatas (tolerância: 0px)
- Formato: PNG ou JPG
- Peso: máximo 5MB
- Texto na imagem: máximo 20% da área
- Fonte: Albert Sans (padrão Zape)
- Legibilidade mobile: simulação 375px width
- Hierarquia visual: headline > body > CTA (por tamanho/peso)
- Contraste: CTA deve ser elemento de maior contraste
- NUNCA botão fake (Meta reprova)

## Camada 2: Compliance Meta

### 2.1 Palavras e Expressões Proibidas
- garantido / garantia de resultado
- comprovado cientificamente
- sem risco / risco zero
- ganhe dinheiro fácil
- renda extra garantida
- enriqueça / fique rico
- resultado certo
- impossível perder
- lucro garantido

### 2.2 Regras de Conteúdo Meta
- Sem antes/depois que implique transformação corporal
- Sem fake UI (botões de play falsos, notificações falsas)
- Sem conteúdo sensacionalista ou clickbait extremo
- Sem discriminação de características pessoais
- Sem claims de saúde não comprovados
- Logo de terceiros (Shopee) deve respeitar guidelines

### 2.3 Padrões Zape Inegociáveis
- NUNCA "anúncio" → sempre "ADS"
- Link: SEMPRE https://zapeecomm.com/curso-ads/ (HTTPS obrigatório)
- Mecanismo: 4 configurações Shopee ADS
- Promessa: ROAS 25 (baseado em dados, não garantia)

## Camada 3: Validação Estratégica

### 3.1 Grunt Test (Donald Miller)
- Em 3 segundos, responde:
  1. O que está sendo oferecido? → Shopee ADS 2.0
  2. Como melhora minha vida? → ROAS 25, mais vendas
  3. O que faço agora? → CTA claro
- Se qualquer resposta não é óbvia: REPROVADO

### 3.2 Attention Ratio (Oli Gardner)
- Ratio ideal: 1:1 (um objetivo, uma ação)
- Múltiplos CTAs ou mensagens conflitantes: REPROVADO

### 3.3 Thumb-Stop Test
- O criativo para o scroll no feed?
- Tem elemento de surpresa, contraste, ou gancho visual?
- Passaria despercebido no meio de 10 posts? Se sim: REPROVADO

## Routing de Falhas

| Falha | Volta para | Exemplo |
|-------|------------|---------|
| Dimensão, formato, peso, fonte, hierarquia | **Thomas** | Imagem 1200x1200, fonte errada |
| Palavras proibidas, promessa, link, "anúncio" | **Rita** | "Resultado garantido", link HTTP |
| Ângulo errado, sem mecanismo, CTA fraco, Grunt Test fail | **Max** | Briefing era dor mas saiu curiosidade |
