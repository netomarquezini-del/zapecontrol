# MAPA COMPLETO DE HABILIDADES — Gestor de Trafego Meta Ads (World-Class)

> Documento de referencia exaustivo para construir o agente de trafego pago mais completo possivel.
> Contexto: Zapeecomm — Mentoria de e-commerce (Shopee/ML), funil de lead gen para calls de vendas.

---

## 1. CONHECIMENTO TECNICO DA PLATAFORMA

### 1.1 Estrutura de Conta

**Sub-habilidades:**
- Hierarquia completa: Business Manager > Ad Account > Campaign > Ad Set > Ad
- Configuracao de Business Manager: verificacao de dominio, atribuicao de ativos, permissoes de usuario
- Limites de conta: limite de gastos, limite de campanhas ativas (250 por conta), limite de ads por ad set
- Multi-conta: quando e por que usar mais de uma ad account
- Nomenclatura padronizada: sistema de naming convention para campanhas, ad sets e ads (ex: `[Objetivo]_[Publico]_[Data]_[Criativo]`)
- Organizacao por fase de funil: TOFU / MOFU / BOFU em campanhas separadas ou dentro da mesma campanha

**Por que importa:** Conta desorganizada = dados poluidos = decisoes erradas. Naming convention ruim = impossivel fazer analise comparativa em escala.

**Dados/conhecimento necessario:**
- Limites atuais da plataforma (atualizados trimestralmente pela Meta)
- Best practices de naming convention por vertical
- Regras de Business Manager (verificacao, limites, compliance)

---

### 1.2 Objetivos de Campanha

**Sub-habilidades:**
- Dominar todos os 6 objetivos atuais (pos-ODAX):
  - **Awareness** — Alcance, brand recall, video views
  - **Traffic** — Cliques no link, visitas na LP, landing page views
  - **Engagement** — Post engagement, conversas (Messenger/WhatsApp/IG Direct)
  - **Leads** — Instant Forms, conversoes no site, Messenger leads, calls
  - **App Promotion** — Instalacao de app, eventos in-app
  - **Sales** — Conversoes no site, catalog sales, conversas para vendas
- Saber quando usar cada objetivo com base no funil do cliente
- Entender como o objetivo afeta o algoritmo de entrega (otimiza pra o que voce pede)
- Diferenca entre Conversion Location: Website, App, Messenger, WhatsApp, Instagram, Instant Form, Calls
- Advantage+ Campaign Budget vs Campaign Budget Optimization vs Ad Set Budget

**Por que importa:** Objetivo errado = algoritmo otimizando para a coisa errada. Campanha de trafego NAO gera leads baratos. Campanha de leads NAO gera awareness eficiente.

**Dados/conhecimento necessario:**
- Matriz de decisao: tipo de negocio x objetivo ideal
- Benchmarks de custo por objetivo por vertical (infoprodutos/mentorias)
- Mudancas recentes na taxonomia de objetivos da Meta (ODAX)

---

### 1.3 Eventos de Otimizacao

**Sub-habilidades:**
- Eventos padrao do Pixel: ViewContent, AddToCart, InitiateCheckout, Purchase, Lead, CompleteRegistration, Contact, Schedule, StartTrial, SubmitApplication
- Eventos customizados: como criar, quando usar, naming convention
- Hierarquia de eventos para otimizacao: Purchase > AddToCart > ViewContent
- Aggregated Event Measurement (AEM): priorizacao de ate 8 eventos por dominio
- Value Optimization: otimizar por valor de conversao (quando tem dados suficientes)
- Conversao customizada vs evento customizado: quando usar cada um
- Conversion window: 1-day click, 7-day click, 1-day view — impacto na otimizacao e report

**Por que importa:** O evento de otimizacao e o que diz pro algoritmo "quero mais disso". Evento errado = leads baratos mas desqualificados, ou leads caros mas pouca escala.

**Dados/conhecimento necessario:**
- Volume minimo de eventos para otimizacao (50 eventos/semana por ad set e a recomendacao da Meta)
- Quando "subir" na hierarquia de eventos (ex: otimizar para Purchase quando tem volume)
- Impacto do iOS 14.5+ na mensuração de eventos

---

### 1.4 Pixel e Conversions API (CAPI)

**Sub-habilidades:**
- Instalacao do Pixel: manual (codigo), via GTM, via integracao nativa (Shopify, WordPress, etc.)
- Teste de eventos: Events Manager, Pixel Helper Chrome Extension, Test Events tool
- Deduplicacao de eventos: event_id para evitar contagem dupla entre Pixel e CAPI
- Server-side tracking via CAPI: setup direto, via parceiro (Stape, GTM Server-side)
- Event Match Quality (EMQ): score de 0-10, como melhorar (enviar mais parametros: email, phone, fbp, fbc)
- Diagnostico de Pixel: eventos nao disparando, parametros faltando, dominio nao verificado
- Dominio verificado e priorizacao de eventos (Aggregated Event Measurement)
- Data Processing Options: Limited Data Use para compliance com privacidade

**Por que importa:** Sem tracking correto, nao existe otimizacao. CAPI e obrigatorio pos-iOS 14.5 — sem ela, voce perde 30-50% dos dados de conversao. EMQ baixo = algoritmo cego.

**Dados/conhecimento necessario:**
- Checklist de implementacao de Pixel + CAPI
- Troubleshooting de eventos (disparo duplicado, parametros faltando)
- Score EMQ ideal (>= 6.0) e como melhorar
- Impacto do ATT (App Tracking Transparency) nos dados

---

### 1.5 Catalogo de Produtos

**Sub-habilidades:**
- Criacao e gerenciamento de catalogo no Commerce Manager
- Feed de produtos: XML, CSV, API, integracoes nativas
- Campos obrigatorios vs opcionais do feed
- Catalogo para servicos (mentorias, cursos): como adaptar
- Dynamic Ads (Advantage+ Catalog Ads): retargeting automatico de produtos vistos
- Product sets: segmentacao dentro do catalogo
- Catalog sales campaigns: configuracao e otimizacao
- Overlay e customizacao de criativos do catalogo (preco, desconto, frete gratis)

**Por que importa:** Para infoprodutos, o catalogo pode parecer irrelevante, mas Advantage+ Catalog Ads funciona MUITO bem para retargeting com multiplos produtos/mentorias.

**Dados/conhecimento necessario:**
- Formato de feed aceito pela Meta
- Best practices para catalogo de servicos/infoprodutos
- Regras de reprovacao de itens do catalogo

---

### 1.6 Posicionamentos (Placements)

**Sub-habilidades:**
- Todos os posicionamentos disponiveis:
  - **Facebook:** Feed, Stories, Reels, In-stream video, Search results, Instant Articles, Right column, Marketplace
  - **Instagram:** Feed, Stories, Reels, Explore, Explore Home, Profile feed, Search results
  - **Messenger:** Inbox, Stories, Sponsored messages
  - **Audience Network:** Native/banner/interstitial, Rewarded video, In-stream video
  - **WhatsApp:** Status (limitado a alguns paises)
- Advantage+ Placements (automatico) vs Manual Placements
- Quando usar manual: criativos que nao adaptam bem a todos os formatos
- Especificacoes de formato por posicionamento (aspect ratio, duracao, tamanho)
- Breakdown de performance por posicionamento: como analisar
- Placement optimization: deixar o algoritmo alocar vs forcar posicao

**Por que importa:** 95% das vezes, Advantage+ Placements performa melhor porque o algoritmo distribui o budget para onde o CPM e melhor. Manual so quando o criativo exige.

**Dados/conhecimento necessario:**
- Tabela de especificacoes por posicionamento (atualizada)
- Benchmarks de CPM/CTR por posicionamento por vertical
- Quando forcar manual (ex: so Reels, so Stories)

---

### 1.7 Estrategias de Lance (Bidding)

**Sub-habilidades:**
- **Highest Volume** (antigo Lowest Cost): Maximiza conversoes dentro do budget. Melhor para quem quer volume.
- **Highest Value** (antigo Highest ROAS): Maximiza valor de conversao. Melhor para e-commerce com valor variavel.
- **Cost per Result Goal** (antigo Cost Cap): Define CPA maximo. Bom para controle de custo, pode limitar volume.
- **ROAS Goal** (antigo Minimum ROAS): Define ROAS minimo. Para e-commerce com margem definida.
- **Bid Cap**: Define lance maximo no leilao. Para controle total, risco de nao gastar.
- Quando usar cada estrategia com base no objetivo e maturidade da campanha
- Impacto do bid na fase de aprendizado
- Bid multiplier (ajuste de lance por posicionamento, horario, etc.)

**Por que importa:** Bid strategy errada e a diferenca entre gastar R$10k e ter resultado ou gastar R$10k e nao entregar nada. Cost Cap muito agressivo = campanha nao gasta. Highest Volume sem controle = CPA explode.

**Dados/conhecimento necessario:**
- Matriz de decisao: fase da campanha x bid strategy ideal
- Valores de referencia para Cost Cap e Bid Cap por vertical
- Como o leilao da Meta funciona (Total Value = Bid x Estimated Action Rate x Ad Quality)

---

### 1.8 Advantage+ (Suite Completa)

**Sub-habilidades:**
- **Advantage+ Audience**: Targeting expandido automaticamente pela Meta (substitui broad)
- **Advantage+ Placements**: Distribuicao automatica entre posicionamentos
- **Advantage+ Creative**: Otimizacoes automaticas no criativo (brilho, contraste, template, musica)
  - Advantage+ Creative Standard Enhancements
  - Advantage+ Creative Catalog
  - Text Variations
  - Media Enhancement
- **Advantage+ Shopping Campaigns (ASC)**: Campanha totalmente automatizada para e-commerce
  - Configuracao: existing customers vs new customers
  - Budget cap para existing customers (recomendado 20-30%)
  - Maximo de 150 combinacoes de criativos
  - Quando funciona: alto volume de conversao, criativos variados
- **Advantage Campaign Budget**: CBO com otimizacao avancada
- **Advantage Lookalike**: Expansao automatica de LAL
- **Advantage Detailed Targeting**: Expansao automatica de interesses

**Por que importa:** O futuro da Meta e automacao. Quem nao entende Advantage+ vai ficar pra tras. Mas quem liga tudo no automatico sem entender tambem desperdi orcamento. O gestor precisa saber QUANDO ativar e QUANDO desativar cada recurso Advantage+.

**Dados/conhecimento necessario:**
- Lista completa de features Advantage+ com status (GA, Beta, Limited)
- Resultados de testes A/B com e sem Advantage+ por tipo de campanha
- Restricoes de ASC (ex: nao permite exclusoes, nao permite certos targeting)

---

### 1.9 A/B Testing Tool

**Sub-habilidades:**
- Criacao de testes A/B nativos da plataforma (Experiments)
- Variaveis testaveis: audiencia, criativo, placement, delivery optimization
- Definicao de hipotese, KPI primario, duracao minima do teste
- Tamanho de amostra: calculo de significancia estatistica
- Holdout tests: medir incrementalidade real dos ads
- Brand lift studies: medir impacto na percepcao de marca
- Conversion lift studies: medir incrementalidade de conversoes
- Como interpretar resultados: confidence level, lift, p-value

**Por que importa:** Testar sem rigor estatistico e jogar moeda. A ferramenta nativa da Meta garante que o teste e feito com grupos de controle adequados, sem contaminacao.

**Dados/conhecimento necessario:**
- Calculadora de tamanho de amostra
- Duracao minima recomendada por tipo de teste
- Como configurar holdout tests corretamente

---

### 1.10 Regras Automatizadas (Automated Rules)

**Sub-habilidades:**
- Criacao de regras na plataforma: condicao > acao > frequencia
- Regras comuns:
  - Pausar ad set se CPA > X nos ultimos 3 dias
  - Aumentar budget em 20% se CPA < X nos ultimos 3 dias
  - Pausar ad se frequencia > 3.5
  - Notificar se spend > X sem conversao
  - Pausar ad set se CTR < 1% apos 1000 impressoes
- Regras de horario: ligar/desligar campanhas por horario
- Regras de budget: cap diario/semanal via regra
- Attribution window nas regras: cuidado com janela curta que nao captura conversoes atrasadas
- Limitacoes das regras nativas (frequencia de checagem, precisao)
- Ferramentas terceiras para regras mais sofisticadas (Revealbot, Madgicx, etc.)

**Por que importa:** Regras automatizadas permitem que a conta se auto-otimize 24/7. Sem elas, voce depende de olhar manual — e quando voce dorme, a campanha pode estar queimando dinheiro.

**Dados/conhecimento necessario:**
- Biblioteca de regras pre-configuradas por tipo de conta
- Thresholds recomendados por vertical (ex: CPA max para infoprodutos de mentoria)
- Frequencia ideal de checagem por tipo de regra

---

### 1.11 Creative Hub e Mockups

**Sub-habilidades:**
- Criacao de mockups de anuncios no Creative Hub
- Preview de como o ad aparece em cada posicionamento
- Compartilhamento de mockups para aprovacao do cliente
- Creative Toolkit: templates, melhores praticas por formato
- Dynamic Creative (DCO): configuracao de multiplas variacoes automaticas
- Flexible Ads: diferenca vs Dynamic Creative

**Por que importa:** Preview antes de publicar evita erros de formato, crop errado, texto cortado. Creative Hub permite iterar mais rapido sem gastar dinheiro.

**Dados/conhecimento necessario:**
- Safe zones por posicionamento (onde o texto/logo nao sera cortado)
- Especificacoes atualizadas de formato (mudancas frequentes)

---

### 1.12 Attribution Settings

**Sub-habilidades:**
- Janelas de atribuicao: 1-day click, 7-day click, 1-day view, 28-day click (removido pos-iOS14.5)
- Default attribution setting: 7-day click, 1-day view
- Como a janela de atribuicao afeta o report de conversoes
- View-through attribution: controversa — quando faz sentido e quando infla resultados
- Click-through attribution: mais conservadora e confiavel
- Comparacao de janelas: como mudar a janela muda dramaticamente os numeros
- Attribution models da Meta: last touch (padrao) vs data-driven attribution
- Cross-device attribution: como a Meta rastrea entre dispositivos
- Discrepancias com GA4: por que os numeros nunca batem (e como reconciliar)

**Por que importa:** Sem entender atribuicao, voce acha que a campanha esta performando (ou nao) quando na verdade o dado esta errado. Janela de 1-day click mostra 50% menos conversoes que 7-day click — isso muda completamente a decisao.

**Dados/conhecimento necessario:**
- Comparativo de conversoes por janela de atribuicao (tabela real da conta)
- Metodologia de reconciliacao Meta Ads vs GA4
- Impacto do SKAN (SKAdNetwork) em dados iOS

---

## 2. FRAMEWORKS ESTRATEGICOS

### 2.1 Estrutura de Campanha

**Sub-habilidades:**
- **Modelo Simplificado (Charley Tichenor / CTC):**
  - 1-3 campanhas de prospeccao (TOFU)
  - 1 campanha de retargeting (MOFU/BOFU)
  - 1 campanha ASC (Advantage+ Shopping)
  - Total: 3-5 campanhas ativas
  - Principio: consolidar sinais para o algoritmo
- **Modelo 3-3-3 (Pedro Sobral):**
  - 3 campanhas de teste de criativo (ABO, budget baixo)
  - 3 campanhas de escala (CBO, budget alto)
  - 3 campanhas de retargeting (segmentado por tempo)
- **Modelo CBO Cookbook (Depesh Mandalia):**
  - Fase 1: ABO Testing — R$30-50/dia por ad set, testar publicos e criativos
  - Fase 2: CBO Graduation — agrupar winners em CBO
  - Fase 3: Escala — aumentar budget do CBO progressivamente
- **Modelo Pillar-based (Jon Loomer):**
  - Pillar Campaign 1: Prospeccao Broad
  - Pillar Campaign 2: Prospeccao Lookalike
  - Pillar Campaign 3: Retargeting Engagers
  - Pillar Campaign 4: Retargeting Visitantes/Leads
- Quando usar cada modelo: tamanho da conta, budget, volume de conversoes

**Por que importa:** Estrutura de campanha e a fundacao. Estrutura ruim = dados fragmentados, sobreposicao de publico, budget mal distribuido. Cada modelo funciona para um perfil de conta.

**Dados/conhecimento necessario:**
- Budget minimo para cada modelo funcionar
- Volume de conversoes necessario para cada modelo
- Decision tree: qual modelo usar baseado no perfil da conta

---

### 2.2 Testing Frameworks

**Sub-habilidades:**
- **Framework 3:2:2 (Charley Tichenor):** 3 visuais, 2 textos, 2 headlines
- **Framework de Isolamento de Variavel:** Testar 1 coisa por vez
  - Sprint 1: Testar VISUAL (3 opcoes, mesmo texto)
  - Sprint 2: Testar COPY (3 opcoes, visual winner)
  - Sprint 3: Testar HEADLINE (3 opcoes, visual+copy winners)
  - Sprint 4: Testar CTA (3 opcoes)
  - Sprint 5: Testar FORMATO (video vs imagem vs carrossel)
- **Framework de Iteracao:** Pegar o winner e criar 3-5 variacoes
  - Variacoes de visual: diferentes cores, layouts, angulos de camera
  - Variacoes de copy: mesmo angulo, palavras diferentes
  - Variacoes de hook: primeiros 3 segundos diferentes
- **Framework de Volume Testing (Andrew Foxwell):**
  - Testar 20-30 criativos por semana em budget baixo
  - Matar 80% em 48h
  - Escalar os 20% winners
- **Matriz de Hipoteses:**
  - Documentar hipotese antes do teste
  - Definir KPI primario e threshold de sucesso
  - Definir duracao minima e amostra minima
  - Documentar resultado e aprendizado

**Por que importa:** Sem framework de teste, o gestor testa no escuro. Testa muita coisa ao mesmo tempo (nao sabe o que ganhou). Ou testa devagar demais (concorrente passa na frente).

**Dados/conhecimento necessario:**
- Template de hipotese de teste
- Calculadora de amostra minima (impressoes/conversoes necessarias)
- Historico de testes anteriores e aprendizados (feedback loop)

---

### 2.3 Estrategias de Escala

**Sub-habilidades:**
- **Escala Vertical:** Aumentar budget do que ja funciona
  - Regra dos 20%: maximo 20% de aumento por vez
  - Frequencia de aumento: a cada 48-72h
  - Monitorar: CPA, delivery, fase de aprendizado
  - Limite: quando CPA comeca a subir, parar
- **Escala Horizontal:** Expandir para novos publicos/criativos
  - Duplicar ad set winner com novo publico
  - Duplicar campanha winner com novos criativos
  - Entrar em novos posicionamentos
  - Testar novas geos (cidades, estados, paises)
- **Escala por Campanha ASC:** Advantage+ Shopping
  - Jogar todos os winners em uma ASC
  - Budget alto, targeting automatico
  - Funciona melhor com 20+ criativos variados
- **Escala por Duplicacao:** Sneak Attack Method (Tim Burd)
  - Duplicar ad set winner 3-5 vezes com mesmo publico
  - Cada duplicata compete no leilao separadamente
  - Manter as que performam, matar as que nao
  - Controverso mas eficaz em alta escala
- **Escala CBO Graduation (Depesh Mandalia):**
  - Testar em ABO com budget baixo
  - Graduar winners para CBO
  - Aumentar CBO progressivamente
- **Limites de Escala:** Reconhecer quando a conta chegou no teto
  - TAM (Total Addressable Market) do publico
  - Frequencia crescente = publico saturado
  - CPA estabiliza em patamar mais alto (novo normal)
  - Quando aceitar e quando pivotar

**Por que importa:** Escalar errado e a forma mais rapida de queimar budget. Escalar certo e a forma mais rapida de multiplicar resultado. A diferenca esta no timing e no metodo.

**Dados/conhecimento necessario:**
- Historico de escala da conta: o que funcionou e o que nao
- TAM estimado por publico/geo
- Curva de CPA vs Budget (ponto de rendimento decrescente)

---

### 2.4 Alocacao de Budget

**Sub-habilidades:**
- **Regra 70/20/10:**
  - 70% do budget em campanhas validadas (escala)
  - 20% em testes de novos publicos/criativos
  - 10% em experimentos (novos formatos, novos funis)
- **Budget por Fase de Funil:**
  - TOFU (Prospeccao): 60-70% do budget total
  - MOFU (Retargeting engagers): 15-20%
  - BOFU (Retargeting hot): 10-15%
  - Ajustar conforme tamanho do publico de retargeting
- **Budget Minimo Viavel (MVB):**
  - Para teste de criativo: R$30-50/dia por ad set
  - Para teste de publico: R$50-100/dia por ad set
  - Para campanha de escala: minimo 10x CPA target por dia
  - Para ASC: minimo R$100/dia (recomendado R$300+)
- **Pacing:** Como o algoritmo distribui o budget ao longo do dia
  - Standard delivery: distribuicao uniforme
  - Accelerated delivery: gasta o mais rapido possivel (nao mais disponivel em todos os objetivos)
  - Pacing manual via regras de horario
- **Daily vs Lifetime Budget:**
  - Daily: mais controle, mais previsivel, ajuste facil
  - Lifetime: permite scheduling por horario, algoritmo otimiza distribuicao
  - Quando usar cada um

**Por que importa:** Budget mal distribuido = 70% do dinheiro no que nao converte. Alocacao inteligente maximiza cada real investido.

**Dados/conhecimento necessario:**
- Distribuicao atual de budget por campanha/fase
- CPA target por produto/servico
- Margem de contribuicao por produto (para calcular budget maximo viavel)

---

### 2.5 Arquitetura de Audiencia

**Sub-habilidades:**
- **Mapeamento de temperatura:**
  - Frio: nunca ouviu falar -> awareness/prospeccao
  - Morno: ja interagiu -> retargeting de engajamento
  - Quente: ja demonstrou intencao -> retargeting de conversao
- **Exclusoes estrategicas:**
  - Excluir clientes atuais de prospeccao
  - Excluir leads recentes (<7 dias) de campanha de lead gen
  - Excluir compradores recentes de campanha de venda
  - Nao excluir em ASC (nao permite)
- **Janelas de retargeting:**
  - 1-3 dias: hottest (form abandono, LP visit) -> urgencia maxima
  - 3-7 dias: quente -> prova social, oferta
  - 7-14 dias: morno -> educacao + oferta
  - 14-30 dias: esfriando -> reengage com conteudo
  - 30-90 dias: frio reciclado -> tratar como prospeccao morna
  - 90-180 dias: quase frio -> apenas branding leve
- **Refresh de audiencia:**
  - Atualizar custom audiences mensalmente
  - Criar novas LAL trimestralmente (baseadas em dados mais recentes)
  - Rever exclusoes mensalmente

**Por que importa:** Sem arquitetura de audiencia, voce mostra o mesmo ad pra quem ja comprou, gasta budget em quem nunca vai converter, e nao tem funil — so tem barulho.

**Dados/conhecimento necessario:**
- Tamanho de cada segmento de audiencia
- Taxas de conversao por segmento de temperatura
- Lifetime value por fonte de aquisicao

---

## 3. ANALISE DE CRIATIVOS

### 3.1 Metricas de Criativo

**Sub-habilidades:**
- **Hook Rate:** 3-second video views / impressions
  - Benchmark: >= 30% (bom), >= 40% (excelente)
  - Mede: capacidade de parar o thumb scroll
  - Se baixo: primeiros 3 segundos fracos, visual nao destaca
- **Hold Rate:** ThruPlay (15s ou completo) / 3-second views
  - Benchmark: >= 25% (bom), >= 35% (excelente)
  - Mede: capacidade de manter atencao apos o hook
  - Se baixo: conteudo apos o hook nao entrega valor
- **Thumb-Stop Ratio:** 3-second views / reach
  - Mede: % de pessoas alcancadas que pararam pra ver
  - Mais preciso que Hook Rate porque usa reach (nao impressions)
- **Click-Through Rate (CTR):**
  - CTR (all): inclui cliques no perfil, likes, etc.
  - CTR (link click): apenas cliques no link do ad — ESTA e a metrica que importa
  - Benchmark link CTR: >= 1.5% (bom), >= 2.5% (excelente)
- **Outbound CTR:** Cliques que levam para fora do Facebook/Instagram
  - Mais preciso que link click CTR quando se usa Instant Form
- **Cost per ThruPlay:** Custo para alguem assistir 15s ou o video inteiro
- **Video Completion Rate por quartil:** 25%, 50%, 75%, 100%
  - Identifica ONDE as pessoas abandonam o video
  - Queda brusca no 25% = hook ok mas entrega fraca
  - Queda brusca no 75% = CTA fraco ou video longo demais
- **Engagement Rate:** (Reactions + Comments + Shares) / Reach
  - Social proof: ads com muitos comentarios/shares performam melhor (prova social visivel)
- **Frequency por criativo individual:** (nao so por ad set)
  - Frequencia do criativo > 4 = saturacao certa

**Por que importa:** Metricas de criativo dizem EXATAMENTE onde o criativo esta falhando. Hook fraco? Hold fraco? CTR fraco? Cada problema tem uma solucao diferente. Sem essas metricas, voce troca o criativo inteiro quando o problema era so o hook.

**Dados/conhecimento necessario:**
- Benchmarks por formato (video, imagem, carrossel)
- Benchmarks por vertical (infoprodutos, e-commerce, SaaS)
- Historico de performance de criativos anteriores da conta

---

### 3.2 Analise de Copy

**Sub-habilidades:**
- **Frameworks de copy para ads:**
  - **PAS (Problem-Agitation-Solution):** Problema -> Agitacao -> Solucao
  - **AIDA (Attention-Interest-Desire-Action):** Atencao -> Interesse -> Desejo -> Acao
  - **BAB (Before-After-Bridge):** Antes -> Depois -> Ponte (como chegar la)
  - **4Ps (Picture-Promise-Prove-Push):** Pintar cenario -> Prometer resultado -> Provar -> Empurrar pra acao
  - **PASTOR:** Problema -> Amplificar -> Story -> Transformacao -> Oferta -> Resposta
  - **Star-Chain-Hook:** Protagonista -> Cadeia de fatos -> Gancho de acao
  - **OATH (Oblivious-Apathetic-Thinking-Hurting):** Framework de nivel de consciencia
- **Componentes de copy de ad:**
  - **Hook (primeira linha):** Precisa parar o scroll. Pergunta, dado chocante, dor aguda.
  - **Body:** Desenvolver a promessa, provar, gerar desejo
  - **CTA (Call to Action):** Claro, urgente, especifico
  - **Headline:** Resumo da promessa em 5-10 palavras
  - **Description:** Complemento do headline (visivel em alguns placements)
  - **Display Link:** URL limpa e legivel
- **Copy length:**
  - Short-form (1-3 linhas): testes rapidos, retargeting quente
  - Medium-form (3-7 linhas): maioria dos ads de lead gen
  - Long-form (10+ linhas): storytelling, ads de high-ticket
  - Cada formato tem taxa de engajamento diferente por posicionamento
- **Angulos de copy para infoprodutos/mentorias:**
  - Transformacao: "De X para Y em Z tempo"
  - Prova social: "Mais de 4.000 alunos..."
  - Autoridade: "Metodo criado por quem ja fez R$50M..."
  - Dor: "Voce tenta vender na Shopee mas nao sabe..."
  - Desejo: "Imagina faturar R$100k/mes vendendo online..."
  - Objecao: "Mesmo sem experiencia..."
  - Escassez: "Ultimas X vagas..."
  - Curiosidade: "O metodo que 90% dos sellers nao conhecem..."

**Por que importa:** O visual para o scroll. A copy converte. Um ad com visual top e copy ruim gera clique mas nao gera lead. Copy e a parte mais subestimada de ads — e a que mais impacta CPA.

**Dados/conhecimento necessario:**
- Banco de copies que ja funcionaram (swipe file da conta)
- Pesquisa de linguagem do publico-alvo (como o cliente fala, nao como a marca fala)
- Objecoes comuns mapeadas pelo comercial

---

### 3.3 Analise Visual

**Sub-habilidades:**
- **Hierarquia visual:** O olho vai pra onde? Headline -> Visual -> CTA
- **Tipos de criativo e quando usar cada:**
  - **Imagem estatica:** Rapido de produzir, bom para ofertas claras, funciona em todos os placements
  - **Video curto (<15s):** Alto hook rate, perfeito pra Reels/Stories, formato dominante em 2024+
  - **Video medio (15-60s):** Bom pra explicar oferta, VSL mini, depoimento
  - **Video longo (60s+):** Storytelling profundo, pre-qualifica o lead, funciona em feed
  - **Carrossel:** Bom pra listar beneficios, cases, passo-a-passo. Alto engagement.
  - **UGC (User Generated Content):** Formato que mais converte em 2024+. Parece organico.
  - **Talking head:** Expert falando direto pra camera. Bom pra autoridade.
  - **Screen capture:** Mostrando resultados, tutoriais, provas. Autenticidade.
  - **Memes/cultura pop:** Humor + relevancia cultural. Alto compartilhamento. Risco de reprovacao.
  - **Before/After:** Poderoso mas CUIDADO com politicas da Meta (proibido em saude/beleza)
  - **Listicles:** "5 razoes para...", "3 erros que..." — funciona muito em carrossel ou video
- **Principios de design para ads:**
  - Contraste: ad precisa se destacar no feed (fundo claro no feed escuro e vice-versa)
  - Texto no visual: <20% da imagem (nao e mais regra rigida, mas afeta entrega)
  - Faces humanas: aumentam atencao e confianca
  - Cores da marca: consistencia visual entre ad e LP
  - Mobile-first: 98% veem no celular — design para tela pequena
- **UGC vs Producao:**
  - UGC: custo baixo, autenticidade alta, conversao alta, escala limitada
  - Producao: custo alto, controle total, brand consistency, escala facil
  - Hibrido: UGC com edicao profissional (melhor dos dois mundos)
- **Analise de desempenho por formato:**
  - Cruzar formato (video/imagem/carrossel) com metricas (CTR, CPA, CVR)
  - Identificar qual formato funciona melhor para cada publico e cada posicionamento
  - Manter mix de formatos (nao colocar todos os ovos em video)

**Por que importa:** O visual e responsavel por 80% do hook. Se ninguem para pra ver, nada mais importa. O formato certo no posicionamento certo para o publico certo = CPA ate 3x menor.

**Dados/conhecimento necessario:**
- Library de criativos da conta com tags de formato e performance
- Benchmarks de performance por formato
- Tendencias visuais do mercado (Reels em alta, UGC dominando, etc.)

---

### 3.4 Analise de Landing Page (Ad -> LP Fit)

**Sub-habilidades:**
- **Message Match:** O ad prometeu X, a LP entrega X?
  - Headline do ad = Headline da LP (ou muito similar)
  - Visual do ad = Visual do topo da LP
  - Desalinhamento = alto bounce rate
- **Metricas de LP que impactam ads:**
  - Page Load Speed: >3s = 40% abandono. Meta penaliza LPs lentas.
  - Bounce Rate: >70% = problema serio
  - Time on Page: <10s = nao leu nada, LP ruim ou publico errado
  - Form Completion Rate: <15% = form longo ou assustador
  - Scroll Depth: onde as pessoas param de ler
- **Elementos de LP que o gestor precisa avaliar:**
  - Above the fold: headline + subheadline + CTA visivel sem scroll?
  - Prova social: depoimentos, logos, numeros
  - Objecoes: FAQ, garantia, "pra quem e / pra quem nao e"
  - CTA: claro, um unico CTA, sem distracao
  - Mobile responsiveness: funciona no celular?
- **Ferramentas de analise:** Hotjar/Clarity (heatmaps), GA4, Page Speed Insights

**Por que importa:** Anuncio perfeito mandando pra LP ruim = dinheiro jogado fora. O gestor de trafego precisa diagnosticar quando o problema NAO e o ad, e sim a LP. Se CVR cai mas CTR esta bom, o problema e quase sempre a LP.

**Dados/conhecimento necessario:**
- Metricas de LP por campanha (cruzar com dados de ads)
- Heatmaps e gravacoes de sessao (se disponiveis)
- Benchmarks de page speed e conversion rate por tipo de LP

---

## 4. ANALISE DE DADOS E METRICAS

### 4.1 Metricas Primarias (Resultado de Negocio)

**Sub-habilidades:**
- **CPA (Custo por Aquisicao):** Quanto custa um resultado final (lead qualificado, venda)
  - CPA = Spend / Conversions
  - Variantes: CPL (Custo por Lead), CPA agendamento, CPA venda
  - Meta Ads reporta CPA baseado no evento de otimizacao
  - CPA real vs CPA reportado (discrepancia por atribuicao)
- **ROAS (Return on Ad Spend):** Receita gerada / Investimento em ads
  - ROAS = Revenue / Ad Spend
  - ROAS 3x = R$3 de receita para cada R$1 investido
  - ROAS breakeven: depende da margem (margem 50% = ROAS 2x para empatar)
  - ROAS imediato vs ROAS com LTV (mentoria que gera upsell)
- **CAC (Custo de Aquisicao de Cliente):** Inclui TODOS os custos (ads + equipe + ferramentas + comissao)
  - CAC = (Ad Spend + Custos Operacionais) / Clientes Adquiridos
  - Diferente de CPA: CPA e so o custo de ads, CAC e o custo total
- **LTV (Lifetime Value):** Valor total que um cliente gera ao longo do relacionamento
  - LTV = Ticket Medio x Frequencia de Compra x Tempo de Retencao
  - Para mentorias: LTV = valor da mentoria + upsells + renovacao
  - LTV:CAC ideal: >= 3:1
- **Payback Period:** Tempo para recuperar o CAC
  - Payback = CAC / (Receita Mensal por Cliente)
  - Para mentorias de R$12k parcelado em 12x: payback depende do parcelamento
- **ROI vs ROAS:**
  - ROAS: so considera investimento em ads
  - ROI: considera todos os custos
  - ROI = (Receita - Custos Totais) / Custos Totais x 100%
- **Contribution Margin (Margem de Contribuicao):**
  - Receita - Custos Variaveis (ads + comissao + impostos)
  - E o que sobra pra pagar custos fixos e gerar lucro
  - Se margem de contribuicao e negativa: esta pagando pra vender

**Por que importa:** Metricas de negocio sao as UNICAS que importam pro dono do negocio. CTR alto com CPA acima do suportavel = empresa no prejuizo. O gestor precisa pensar como financeiro, nao como midia.

**Dados/conhecimento necessario:**
- Ticket medio por produto (Aceleracao R$12k, Ultra R$42k, Shopee ADS lowticket)
- Margem de contribuicao por produto
- LTV historico por cohort
- Funil completo: CPL -> CPA agendamento -> CPA venda -> LTV

---

### 4.2 Metricas de Eficiencia (Indicadores de Meio)

**Sub-habilidades:**
- **CPM (Custo por Mil Impressoes):** Custo de entrega
  - Indica competitividade do leilao e qualidade do ad
  - CPM alto + CTR alto = ok (publico valioso)
  - CPM alto + CTR baixo = problema de targeting ou criativo
  - Benchmarks Brasil: R$15-40 para prospeccao, R$5-20 para retargeting
- **CPC (Custo por Clique):**
  - CPC (all): inclui todos os cliques (perfil, like, etc.) — IGNORAR
  - CPC (link click): custo de um clique no link do ad — ESTA importa
  - CPC = CPM / (CTR x 1000)
  - Benchmark: R$1-5 para lead gen de mentorias
- **CTR (Click-Through Rate):**
  - CTR (all): pouco util
  - CTR (link click): cliques relevantes / impressoes
  - Benchmark link CTR: >= 1.5%
  - CTR < 1%: criativo ou publico com problema
  - CTR > 3%: excelente, criativo acertou
- **CVR (Conversion Rate):**
  - CVR = Conversoes / Cliques no link x 100%
  - Benchmark para form: >= 15%
  - Benchmark para LP longa: >= 5-10%
  - CVR baixo com CTR alto = problema na LP
- **Frequency (Frequencia):**
  - Media de vezes que cada pessoa viu o ad
  - 1.0-2.0: saudavel
  - 2.0-3.0: zona de atencao
  - 3.0+: saturacao (exceto retargeting, que tolera ate 5-7)
- **Reach vs Impressions:**
  - Reach: pessoas unicas alcancadas
  - Impressions: total de vezes que o ad foi exibido
  - Impressions / Reach = Frequencia media
- **Quality Ranking, Engagement Rate Ranking, Conversion Rate Ranking:**
  - Diagnosticos da Meta comparando com concorrentes
  - Below Average em Quality: criativo fraco ou LP ruim
  - Below Average em Engagement: hook fraco
  - Below Average em Conversion: LP ou oferta fraca
  - CUIDADO: esses rankings sao relativos e mudam — nao sao verdade absoluta

**Por que importa:** Metricas de eficiencia dizem ONDE no funil esta o gargalo. CPA alto pode ser por CPM alto (leilao), CTR baixo (criativo), ou CVR baixo (LP). Sem decompor, nao sabe onde agir.

**Dados/conhecimento necessario:**
- Benchmarks por vertical e por geo
- Historico da conta para comparar (sua media, nao a media do mercado)
- Correlacao entre metricas (quando CTR cai, CPA sobe — qual a elasticidade?)

---

### 4.3 Metricas de Video

**Sub-habilidades:**
- **Video Views (3 seconds):** Quantas pessoas viram pelo menos 3s
- **ThruPlay:** Quantas pessoas viram 15s ou o video inteiro (se < 15s)
- **Video Average Watch Time:** Tempo medio assistido
- **Video Plays:** Total de vezes que o video comecou a reproduzir
- **Video percentage watched:** 25%, 50%, 75%, 95%, 100%
  - Curva de retencao: mostra onde as pessoas saem
  - Queda abrupta em 25% = hook falhou
  - Queda em 50% = conteudo perdeu interesse
  - Alta retencao ate 75% mas queda no final = CTA fraco ou video longo
- **Cost per Video View (3s):** Indica eficiencia do hook
- **Cost per ThruPlay:** Indica eficiencia do conteudo

**Por que importa:** Video e o formato dominante. Sem entender ONDE as pessoas abandonam, voce nao sabe como melhorar. Um video com hook ruim precisa de novo hook, nao de video novo inteiro.

**Dados/conhecimento necessario:**
- Curva de retencao media por tipo de video (UGC, talking head, animado)
- Benchmarks de ThruPlay rate por vertical
- Correlacao entre video completion e conversao

---

### 4.4 Analise de Cohort

**Sub-habilidades:**
- **Cohort por periodo de aquisicao:**
  - Agrupar leads por semana/mes de captura
  - Rastrear conversao ao longo do tempo (lead -> agendamento -> venda)
  - Identificar se leads de certa campanha/criativo fecham mais
- **Cohort por fonte de aquisicao:**
  - Leads de video vs imagem vs carrossel
  - Leads de publico frio vs retargeting
  - Leads de Instagram vs Facebook
  - Cruzar com taxa de fechamento do comercial
- **Cohort analysis de LTV:**
  - Clientes de Jan/24 gastaram X ao longo de 12 meses
  - Clientes de Jul/24 gastaram Y ao longo de 6 meses
  - Projeccao de LTV baseada em cohorts anteriores
- **Analise de decaimento:**
  - Qual % dos leads agenda call em 24h? 48h? 7d?
  - Qual % dos que agendam comparecem?
  - Qual o tempo medio entre lead e venda?
  - Speed to lead: quanto mais rapido contata, maior conversao

**Por que importa:** Cohort analysis mostra a VERDADE que numeros agregados escondem. Media de CPA e inutil se leads de janeiro convertem 2x mais que leads de fevereiro. Cohort revela qual campanha gera o MELHOR lead, nao so o mais barato.

**Dados/conhecimento necessario:**
- CRM com tracking de fonte de aquisicao (UTMs)
- Dados de fechamento do comercial por fonte
- Historico de LTV por cohort

---

### 4.5 Modelagem de Atribuicao

**Sub-habilidades:**
- **Last-click attribution:** Ultimo clique leva o credito (padrao do GA4)
- **Last-touch attribution:** Ultimo toque (clique ou view) leva o credito (padrao Meta)
- **Multi-touch attribution (MTA):**
  - Linear: todos os toques recebem credito igual
  - Time decay: toques mais recentes recebem mais credito
  - Position-based: primeiro e ultimo toque recebem mais credito
  - Data-driven: algoritmo distribui credito baseado em dados
- **Incrementality testing:**
  - Holdout test: grupo que NAO ve o ad vs grupo que ve
  - Mede o VERDADEIRO incremento dos ads (nao so atribuicao)
  - Conversion Lift Study da Meta: ferramenta nativa
  - Importante para provar que os ads estao gerando vendas ADICIONAIS
- **Media Mix Modeling (MMM):**
  - Analise estatistica de como cada canal contribui para vendas
  - Considera fatores externos (sazonalidade, promocoes, etc.)
  - Para contas com multiplos canais (Meta + Google + organico + email)
  - Ferramentas: Robyn (open-source da Meta), Meridian (Google)
- **Reconciliacao de dados:**
  - Meta Ads mostra X leads
  - GA4 mostra Y leads
  - CRM mostra Z leads
  - Como reconciliar: UTMs, server-side tracking, janelas de atribuicao
  - Regra geral: CRM e a verdade, GA4 e o segundo, Meta e o mais otimista

**Por que importa:** Sem entender atribuicao, voce toma decisao baseado em dados enviesados. Meta sempre vai dizer que Meta e o melhor canal. GA4 sempre vai subestimar Meta (por causa de view-through). A verdade esta no meio — e no CRM.

**Dados/conhecimento necessario:**
- Dados de todos os canais de aquisicao
- Setup de UTMs padronizado
- Acesso a CRM com tracking de fonte

---

### 4.6 Analise Estatistica

**Sub-habilidades:**
- **Significancia estatistica:** Como saber se um resultado e real ou aleatorio
  - Nivel de confianca: 95% como padrao (p-value < 0.05)
  - Tamanho da amostra minimo: depende do efeito esperado
  - Calculadora: ferramentas como ABTestGuide, Evan Miller's calculator
- **Tamanho de amostra:**
  - Para testes de criativo: minimo 1000 impressoes por variacao
  - Para testes de publico: minimo 50 conversoes por grupo
  - Para testes A/B formais: calculadora baseada em conversao atual e lift esperado
- **Vieses comuns:**
  - **Survivorship bias:** So olhar os winners e esquecer os que falharam
  - **Recency bias:** Dar mais peso ao resultado mais recente
  - **Confirmation bias:** Procurar dados que confirmam o que voce ja acredita
  - **Sample size bias:** Declarar winner com dados insuficientes
  - **Day-of-week effect:** Comparar segunda com domingo e achar que algo mudou
- **Regressao a media:** Performance excepcional tende a voltar ao normal
  - Semana com CPA 50% abaixo da media? Provavelmente nao vai se manter.
  - Nao escalar agressivamente baseado em 2-3 dias bons.
  - Olhar media movel de 7 dias, nao snapshots.

**Por que importa:** Decisoes baseadas em dados ruins sao piores que decisoes baseadas em intuicao. Pausar um ad que estava em fase de aprendizado porque "CPA ta alto" e decisao baseada em dados insuficientes.

**Dados/conhecimento necessario:**
- Calculadora de significancia estatistica
- Tabela de amostra minima por tipo de decisao
- Disciplina de esperar dados suficientes antes de agir

---

## 5. DOMINIO DE AUDIENCIA

### 5.1 Custom Audiences

**Sub-habilidades:**
- **Website Custom Audiences:**
  - Visitantes do site (todos): 1, 7, 14, 30, 60, 90, 180 dias
  - Visitantes de pagina especifica (LP, pricing, checkout)
  - Visitantes por tempo gasto (top 25%, top 10%, top 5%)
  - Visitantes que realizaram evento especifico (Lead, AddToCart)
  - Combinacoes: visitou LP MAS nao converteu (retargeting puro)
- **Customer List Audiences:**
  - Upload de lista de clientes (email, telefone, nome)
  - Match rate: tipicamente 40-70% no Brasil
  - Atualizar lista mensalmente (novos clientes, remocao de churners)
  - Segmentar por valor: clientes high-ticket vs low-ticket
  - Segmentar por estagio: leads vs clientes vs ex-clientes
- **Engagement Custom Audiences:**
  - **Instagram:** Interagiu com perfil, visitou perfil, salvou post, DM, 25-50-75-95% video view
  - **Facebook Page:** Engajou com pagina, clicou em CTA, enviou mensagem
  - **Video:** Assistiu 3s, 10s, 25%, 50%, 75%, 95%
  - **Lead Form:** Abriu form, abriu mas nao enviou (OURO para retargeting)
  - **Shopping:** Visualizou produto, adicionou ao carrinho, comprou
  - **Events:** RSVP, participou, comprou ingresso
  - **Instant Experience:** Abriu, clicou em link
- **App Activity Audiences:** Usuarios do app por atividade
- **Offline Activity Audiences:** Conversoes offline (evento, loja, telefone)

**Por que importa:** Custom audiences sao os publicos mais valiosos porque sao baseados em comportamento REAL, nao em interesses estimados. Lead form opener que nao converteu e o retargeting mais barato e mais eficaz que existe.

**Dados/conhecimento necessario:**
- Mapa de todos os custom audiences disponiveis na conta
- Tamanho de cada audience
- Performance historica por audience
- Frequencia de atualizacao de cada audience

---

### 5.2 Lookalike Audiences

**Sub-habilidades:**
- **Seed audiences (fontes) de qualidade:**
  - Compradores (melhor seed possivel)
  - Leads qualificados (que agendaram call)
  - Top 25% clientes por valor (value-based LAL)
  - Engagers do Instagram (volume alto, qualidade media)
  - Email list de clientes (alto valor, match rate variavel)
- **Percentuais de LAL:**
  - 1%: Mais similar, menor volume (~2M pessoas no Brasil)
  - 1-2%: Bom equilibrio
  - 2-5%: Mais volume, menor precisao
  - 5-10%: Quase broad, pouca diferenca de targeting aberto
- **Value-based LAL:** Criar LAL baseada no valor do cliente (LTV)
  - Precisa enviar coluna de valor na customer list
  - Ou usar Purchase com value como seed
  - Algoritmo prioriza encontrar pessoas similares aos de MAIOR VALOR
- **Stacking de LAL:** Combinar multiplas LAL em um unico ad set
  - LAL 1% compradores + LAL 1% leads qualificados
  - Aumenta o pool sem perder qualidade
  - Cuidado com sobreposicao (usar Audience Overlap tool)
- **Refreshing de LAL:** LAL baseada em custom audience que atualiza automaticamente
  - LAL de compradores dos ultimos 180 dias: atualiza conforme novos compradores entram
  - Recriar LAL manualmente a cada 60-90 dias se a seed nao for dinamica
- **LAL em diferentes paises/regioes:**
  - LAL funciona melhor em paises com alta penetracao de Facebook
  - Brasil: excelente para LAL (alta base de usuarios)

**Por que importa:** LAL e o meio-termo perfeito entre targeting de interesse (baixa qualidade) e broad (depende 100% do criativo). LAL de compradores e frequentemente o publico com menor CPA — se a seed tiver qualidade.

**Dados/conhecimento necessario:**
- Lista de todas as seeds disponiveis e seus tamanhos
- Performance historica por LAL (qual % e qual seed performa melhor)
- Audience Overlap entre LALs para evitar duplicacao

---

### 5.3 Interest-Based Targeting e Detailed Targeting

**Sub-habilidades:**
- **Categorias de interesses:**
  - Demographics: idade, genero, localizacao, idioma, escolaridade, cargo
  - Interests: hobbies, paginas curtidas, comportamentos inferidos
  - Behaviors: compras, viagens, uso de dispositivo, early adopters
- **Interest stacking:** Combinar interesses para refinar audiencia
  - AND logic: "Interesse em e-commerce" AND "Interesse em Shopee"
  - OR logic (padrao): qualquer um dos interesses selecionados
  - Narrowing: Facebook > More options > Narrow Audience
- **Exclusoes de audiencia:**
  - Excluir interesses negativos (ex: excluir concorrentes se nao quer eles)
  - Excluir custom audiences (clientes, leads recentes)
  - Excluir regioes/cidades nao atendidas
- **Advantage Detailed Targeting:** Meta expande alem dos interesses selecionados
  - Ativado por padrao em muitos objetivos
  - Geralmente melhora performance (mais sinais pro algoritmo)
  - Desativar so se publico precisa ser MUITO especifico
- **Broad Targeting (sem interesses):**
  - Apenas idade + genero + geo
  - Funciona surpreendentemente bem com Advantage+ e bom criativo
  - O criativo funciona como filtro natural (quem se identifica clica)
  - Recomendado para contas com historico de conversao (Pixel maduro)
- **Audience Suggestions:** Ferramenta da Meta que sugere interesses relacionados
- **Audience Insights:** Dados demograficos e comportamentais de audiencias existentes
- **Audience Overlap Tool:** Verificar sobreposicao entre audiencias
  - Sobreposicao > 30% = considerar combinar em um unico ad set

**Por que importa:** Com Advantage+ e broad, targeting manual perdeu muita relevancia. Mas ainda e util para: contas novas (sem dados de Pixel), nichos muito especificos, e retargeting segmentado. O gestor precisa saber QUANDO usar e QUANDO abrir mao.

**Dados/conhecimento necessario:**
- Lista de interesses relevantes para o nicho (e-commerce, Shopee, marketplaces, renda extra)
- Tamanho estimado de cada audiencia de interesse
- Performance historica: interest targeting vs broad vs LAL
- Mapa de sobreposicao entre audiencias ativas

---

### 5.4 Retargeting Avancado

**Sub-habilidades:**
- **Retargeting sequencial:** Mostrar ads em sequencia baseada em comportamento
  - Dia 1-3: Depoimento de aluno (prova social)
  - Dia 4-7: Video explicando a metodologia (educacao)
  - Dia 8-14: Oferta direta com urgencia
- **Retargeting por nivel de intencao:**
  - Engajou no IG (frio-morno) -> conteudo educativo
  - Visitou LP (morno) -> retargeting com oferta
  - Abriu form mas nao enviou (quente) -> "voce esqueceu algo?"
  - Lead que nao agendou (quente) -> "agende sua sessao"
- **Retargeting de exclusao progressiva:**
  - Excluir quem ja agendou de campanhas de lead gen
  - Excluir quem ja comprou de campanhas de venda
  - Nao excluir de campanhas de upsell/cross-sell
- **Dynamic Retargeting (Catalog):**
  - Mostrar automaticamente o produto/servico que a pessoa viu
  - Funciona com catalogo configurado
  - Adaptavel para mentorias (mostrar a mentoria que visitou)
- **Retargeting de video viewers:**
  - Quem assistiu 25%: interesse leve -> ad mais educativo
  - Quem assistiu 50%: interesse moderado -> ad com oferta
  - Quem assistiu 75%+: interesse forte -> ad direto de conversao
  - Segmentar por video especifico (video de mentoria vs video de curso)
- **Cross-platform retargeting:**
  - Visitou site + engajou no IG = audiencia premium
  - Combinar sinais de multiplas fontes para criar super-audiencias

**Por que importa:** Retargeting tem o menor CPA e maior CVR porque o publico ja conhece voce. Mas retargeting ruim (mostrar o mesmo ad 10 vezes pra quem ja comprou) desperdiça dinheiro e irrita as pessoas.

**Dados/conhecimento necessario:**
- Mapa de todas as audiencias de retargeting disponiveis
- Tamanho de cada audiencia (volume suficiente para campanha separada?)
- Performance por janela de retargeting (1-3d vs 4-7d vs 8-14d vs 15-30d)
- Sequencia de criativos por estagio de retargeting

---

## 6. INTEGRACAO COM FUNIL

### 6.1 Tipos de Funil para Infoprodutos/Mentorias

**Sub-habilidades:**
- **Funil de Aplicacao (Application Funnel):**
  - Ad -> LP com formulario de aplicacao -> SDR qualifica -> Closer fecha
  - Ideal para high-ticket (mentoria R$12k+, consultoria R$42k)
  - CPL mais alto mas lead MUITO mais qualificado
  - Taxa de fechamento esperada: 15-30%
  - ESTE E O FUNIL PRINCIPAL DA ZAPEECOMM
- **Funil de Webinar/Masterclass:**
  - Ad -> Inscricao no webinar -> Webinar ao vivo ou gravado -> Oferta no final
  - Bom para meio-ticket (R$1k-5k)
  - CPL baixo (R$5-15), taxa de presenca 20-30%, taxa de conversao 3-10%
- **Funil de VSL (Video Sales Letter):**
  - Ad -> LP com video longo de vendas -> CTA no final do video
  - Bom para qualquer ticket se o VSL e forte
  - Pre-qualifica pelo tempo: so quem assiste ate o final chega na oferta
  - Taxa de conversao: 1-5% dos que assistiram completo
- **Funil de Desafio (Challenge Funnel):**
  - Ad -> Inscricao no desafio gratuito (5-7 dias) -> Oferta no ultimo dia
  - Alto engajamento, cria comunidade, gera prova social
  - CPL baixo, conversao no desafio 5-15%
  - Requer producao de conteudo e gestao de grupo
- **Funil de Isca Digital (Lead Magnet):**
  - Ad -> LP para baixar ebook/checklist/aula gratis -> Email sequence -> Oferta
  - CPL muito baixo (R$2-8), lead frio, conversao depende da sequencia
  - Bom para construir lista, ruim para venda imediata de high-ticket
- **Funil de WhatsApp:**
  - Ad (Click-to-WhatsApp) -> Conversa no WhatsApp -> SDR qualifica -> Oferta
  - CPA de conversa: R$3-15
  - Vantagem: conversa direta, rapport rapido, alta taxa de resposta
  - Desvantagem: depende de equipe de SDR rapida, nao escala facil
  - OPORTUNIDADE RELEVANTE PARA ZAPEECOMM (ja usa WhatsApp)
- **Funil de Tripwire (Low-ticket -> High-ticket):**
  - Ad -> Compra de produto barato (R$47-197) -> Upsell para mentoria
  - Auto-liquida custo de ads no low-ticket
  - Identifica compradores para vender high-ticket depois
  - Shopee ADS 2.0 pode ser o tripwire da Zapeecomm

**Por que importa:** O tipo de funil muda TUDO na estrategia de ads: objetivo de campanha, evento de otimizacao, tipo de criativo, CPA target, publico ideal. Um gestor que nao entende o funil faz ads para o lugar errado.

**Dados/conhecimento necessario:**
- Qual funil esta ativo atualmente
- Taxas de conversao de cada etapa do funil
- Benchmarks de taxa por tipo de funil no nicho de infoprodutos
- Integracao entre Meta Ads e o CRM/plataforma de vendas

---

### 6.2 Metricas Cross-Funil

**Sub-habilidades:**
- **Funil completo mapeado com metricas:**
  ```
  Impressao -> Clique -> Visita LP -> Lead -> Agendamento -> Show-up -> Call -> Proposta -> Venda
     |           |          |          |          |             |         |         |          |
    CPM        CPC      Page View   CPL       CPA_agend    Show Rate  Call Rate  Prop Rate  Close Rate
     |           |       Cost         |          |             |         |         |          |
    CTR       CPC     Bounce Rate   CVR_form   Taxa Agend   Taxa Show  Taxa Call  Taxa Prop  ROAS
  ```
- **Cada transicao e um ponto de otimizacao:**
  - Impressao -> Clique: problema de CRIATIVO
  - Clique -> Lead: problema de LP ou OFERTA
  - Lead -> Agendamento: problema de FOLLOW-UP ou QUALIDADE do lead
  - Agendamento -> Show-up: problema de LEMBRETES ou QUALIFICACAO
  - Call -> Venda: problema de SCRIPT ou OFERTA
- **Speed to Lead:**
  - Tempo entre o lead cair e alguem entrar em contato
  - <5 minutos: 9x mais chances de conversao vs >30 minutos
  - Monitorar e alertar se tempo de contato estiver alto
- **Lead Score baseado em fonte:**
  - Lead de retargeting: score 8-10 (ja conhece)
  - Lead de LAL de compradores: score 6-8
  - Lead de interesse broad: score 4-6
  - Lead de awareness: score 2-4
  - Score alimenta a priorizacao do SDR

**Por que importa:** O gestor de trafego que so olha ate o lead esta cego. Se leads baratos nao fecham, esta gerando lixo. Se leads caros fecham em alta taxa, esta gerando ouro. A visao cross-funil e o que separa gestor bom de gestor excelente.

**Dados/conhecimento necessario:**
- Dados do CRM: lead -> agendamento -> show -> call -> venda
- UTMs configurados corretamente em todos os ads
- Dashboard integrado (Meta Ads + CRM)
- SLAs do comercial (tempo de contato, taxa de agendamento esperada)

---

### 6.3 LTV:CAC e Unit Economics

**Sub-habilidades:**
- **Calculo de LTV por produto:**
  - Aceleracao Shopee: R$12.000 (se nao tem upsell) a R$15.000+ (com upsell)
  - Ultra Shopee: R$42.000 (se nao tem upsell) a R$50.000+ (com upsell)
  - Shopee ADS 2.0: R$197 (low-ticket) + potencial upsell para mentoria
- **Calculo de CAC:**
  - Ad spend + salario SDR proporcional + ferramentas + comissao de vendas
  - CAC varia por produto e por fonte de aquisicao
- **LTV:CAC Ratio:**
  - < 1:1 = prejuizo (esta pagando pra vender)
  - 1:1 a 2:1 = perigoso (qualquer variacao gera prejuizo)
  - 3:1 = saudavel (referencia de ouro)
  - > 5:1 = talvez esteja sub-investindo em ads (oportunidade de escalar)
- **Break-even ROAS:**
  - ROAS BE = 1 / Margem de Contribuicao
  - Margem 50%: ROAS BE = 2x
  - Margem 33%: ROAS BE = 3x
  - Margem 25%: ROAS BE = 4x
  - Tudo acima do ROAS BE e lucro
- **Payback Period:**
  - Se CAC = R$3.000 e mentoria e parcelada em 12x de R$1.000
  - Receita mensal: R$1.000
  - Payback: 3 meses
  - Payback < 3 meses: excelente (pode reinvestir rapido)
  - Payback > 6 meses: cuidado com fluxo de caixa

**Por que importa:** Unit economics e o que determina se o negocio PODE escalar ads. Se LTV:CAC < 3:1, escalar ads so escala o prejuizo. O gestor precisa entender isso pra nao recomendar escala quando a unidade economica nao suporta.

**Dados/conhecimento necessario:**
- Ticket medio real (descontando inadimplencia/chargeback)
- Taxa de upsell/cross-sell por produto
- Custos variaveis por venda
- Inadimplencia media

---

## 7. BUDGET E FINANCEIRO

### 7.1 Planejamento de Budget

**Sub-habilidades:**
- **Budget reverso (de meta de vendas para budget):**
  - Meta: 10 vendas/mes de Aceleracao (R$12k)
  - Taxa de fechamento: 20%
  - Calls necessarias: 50
  - Taxa de show-up: 70%
  - Agendamentos necessarios: ~72
  - Taxa de agendamento: 30%
  - Leads necessarios: ~240
  - CPL target: R$50
  - Budget necessario: R$12.000/mes
  - ROAS esperado: R$120.000 / R$12.000 = 10x
- **Budget forward (de budget para resultado esperado):**
  - Budget: R$10.000/mes
  - CPL historico: R$40
  - Leads esperados: 250
  - Taxa de agendamento: 30% -> 75 agendamentos
  - Show-up: 70% -> ~53 calls
  - Fechamento: 20% -> ~10 vendas
  - Receita esperada: 10 x R$12.000 = R$120.000
  - ROAS projetado: 12x
- **Budget de teste vs budget de escala:**
  - Teste: 10-20% do budget total para novos criativos/publicos
  - Escala: 70-80% do budget total para o que ja esta validado
  - Buffer: 10% para oportunidades (sazonalidade, viralizacao)
- **Budget sazonal:**
  - Datas importantes para Shopee: 11.11, Black Friday, Natal
  - Aumentar budget 30-50% em datas-chave
  - Reduzir budget em periodos sazonais fracos (janeiro pos-ferias)
  - Antecipar aumento de CPM em periodos competitivos (novembro-dezembro)

**Por que importa:** Budget sem planejamento e esperanca disfarçada de estrategia. O gestor precisa saber EXATAMENTE quanto investir para atingir a meta, e quando a meta nao e realizavel com o budget disponivel.

**Dados/conhecimento necessario:**
- Historico de CPL, taxa de agendamento, show-up e fechamento
- Meta de vendas mensal por produto
- Sazonalidade do nicho
- Margem de contribuicao para calcular budget maximo viavel

---

### 7.2 Gestao de Fluxo e Pacing

**Sub-habilidades:**
- **Pacing diario:**
  - Budget diario X esta sendo gasto consistentemente?
  - Under-pacing (gastando menos que o budget): bid muito baixo ou publico muito pequeno
  - Over-pacing (gastando mais que o budget): raro, mas pode acontecer com lifetime budget
- **Pacing semanal/mensal:**
  - Budget mensal dividido por semana
  - Semana 1: 20% (ramp up)
  - Semanas 2-3: 30% cada (pico)
  - Semana 4: 20% (otimizar e fechar)
- **Cash flow vs Ad Spend:**
  - Se o produto e parcelado (12x), a receita entra lenta mas o ad spend sai na hora
  - Precisa ter capital de giro para bancar ads enquanto as parcelas entram
  - Calculo: budget mensal ads x 3 meses = capital minimo necessario
- **Alertas de budget:**
  - Campanha gastou 50% do budget mensal antes da metade do mes
  - Campanha nao esta gastando (delivery issue)
  - CPA subiu acima de 150% do target (queimando dinheiro)

**Por que importa:** Gestor que nao monitora pacing chega no dia 20 sem budget ou gasta tudo ate o dia 15. Entender cash flow e fundamental para negocio que vende parcelado.

**Dados/conhecimento necessario:**
- Budget mensal disponivel
- Calendario de pacing
- Dados de fluxo de caixa (se acessivel)
- Alertas automatizados de gasto

---

## 8. TROUBLESHOOTING

### 8.1 Problemas de Entrega

**Sub-habilidades:**
- **Ad em "Learning Limited":**
  - Causa: menos de 50 eventos de otimizacao em 7 dias
  - Solucao: aumentar budget, expandir publico, subir na hierarquia de eventos (Lead -> ViewContent), consolidar ad sets
  - NAO mexer no ad set — esperar sair do learning ou consolidar
- **Ad nao entregando (0 impressoes):**
  - Checklist: budget ok? Schedule ok? Publico nao muito pequeno? Bid nao muito baixo? Ad aprovado? Limite de conta nao atingido? Pagamento ativo?
  - Causas comuns: publico < 1000 pessoas, bid cap muito baixo, ad reprovado mas nao mostra
- **Flutuacao de performance:**
  - Normal: variacao de +/- 20% dia a dia
  - Problema: variacao > 50% dia a dia
  - Causas: fase de aprendizado, sazonalidade, competicao no leilao, mudanca no algoritmo
  - Acao: media movel de 7 dias, nao reagir a 1 dia ruim
- **Entrega concentrada:**
  - Todo o budget gasto em 2-3 horas = bid muito alto ou publico muito reativo
  - Solucao: bid cap, schedule, ou deixar o algoritmo aprender (standard delivery)

**Por que importa:** 80% dos problemas de ads sao de entrega, nao de criativo. Um ad excelente que nao entrega e um ad que nao existe.

**Dados/conhecimento necessario:**
- Checklist de troubleshooting de entrega
- Status de cada campanha/ad set/ad
- Historico de delivery e pacing

---

### 8.2 Problemas de Criativo e Reprovacao

**Sub-habilidades:**
- **Reprovacao de ad (Ad Rejected):**
  - Motivos comuns: texto excessivo na imagem, claims proibidos, before/after, conteudo adulto, linguagem sensacionalista
  - Request review: como e quando solicitar revisao manual
  - Apelacao: como apelar reprovacoes injustas
  - Workarounds: reformular copy sem perder a mensagem
- **Conta restrita (Account Restricted):**
  - Causas: multiplas reprovacoes, violacao de politica grave, atividade suspeita
  - Acao imediata: request review, suporte via chat, documentacao
  - Prevencao: compliance checklist antes de publicar
  - Business verification: essencial para proteger a conta
- **Baixa qualidade de ad (Low Quality):**
  - Quality Ranking "Below Average"
  - Causas: LP lenta, experiencia ruim, clickbait, engagement bait
  - Impacto: CPM mais alto, menos delivery
  - Solucao: melhorar LP, melhorar relevancia do ad

**Por que importa:** Ad reprovado = investimento parado. Conta restrita = negocio parado. Compliance nao e opcional — e sobrevivencia.

**Dados/conhecimento necessario:**
- Lista de politicas de anuncios da Meta (atualizada)
- Checklist de compliance pre-publicacao
- Historico de reprovacoes da conta e motivos
- Contato do suporte Meta (Business Help Center, chat, partner support)

---

### 8.3 Problemas de Tracking

**Sub-habilidades:**
- **Pixel nao dispara:**
  - Verificar: Pixel Helper, Events Manager Test Events
  - Causas: Pixel removido do site, JS error, bloqueador de ad, cache
  - Solucao: reinstalar Pixel, debugar JS, verificar GTM
- **Eventos duplicados:**
  - Pixel + CAPI sem deduplicacao = conta dupla
  - Verificar: Event Manager mostra "Browser" + "Server" com mesmo event_id?
  - Solucao: implementar deduplicacao via event_id
- **Event Match Quality (EMQ) baixo:**
  - Score < 4: algoritmo nao consegue atribuir conversoes bem
  - Solucao: enviar mais parametros (email, phone, fbp, fbc, IP, user agent)
  - Verificar: Events Manager > Overview > Event Match Quality
- **Discrepancia entre Meta e CRM:**
  - Meta mostra 100 leads, CRM mostra 60
  - Causas: janela de atribuicao, view-through, duplicatas, bots
  - Solucao: comparar com UTMs, verificar quality do lead, filtrar bots
- **Conversoes atrasadas:**
  - Meta atribui conversoes retroativamente (ate 7 dias)
  - Report de hoje pode mudar amanha
  - Solucao: esperar 48-72h antes de julgar performance de um dia
  - Usar "time of conversion" vs "time of impression" no report

**Por que importa:** Tracking errado = decisoes erradas. Se o Pixel nao dispara, a campanha nao otimiza. Se eventos estao duplicados, CPA parece metade do real. Tracking e a fundacao de tudo.

**Dados/conhecimento necessario:**
- Status do Pixel e CAPI (funcionando, EMQ score)
- Checklist de diagnostico de tracking
- Mapa de eventos configurados vs eventos esperados

---

### 8.4 Problemas de Performance

**Sub-habilidades:**
- **CPA subindo gradualmente:**
  - Diagnostico: criativo saturado (frequencia), publico esgotado, competicao sazonal
  - Acao por causa:
    - Saturacao: novos criativos
    - Publico esgotado: novos publicos ou broad
    - Competicao: aceitar novo patamar ou reduzir temporariamente
- **CPA explodiu de repente:**
  - Diagnostico: mudanca na campanha (acao interna), mudanca na LP, pixel quebrou, mudanca na plataforma (update Meta), sazonalidade
  - Acao: checar historico de mudancas, checar pixel, checar LP, comparar com media historica
- **Volume caiu:**
  - Diagnostico: budget cap atingido, publico saturado, bid muito baixo, ad saiu de learning
  - Acao: expandir publico, aumentar budget, revisar bid strategy
- **ROAS caiu sem CPA mudar:**
  - Diagnostico: ticket medio caiu, taxa de fechamento caiu, inadimplencia subiu
  - Causa: NAO e de ads — e de negocio/comercial
  - Acao: alertar equipe comercial, analisar qualidade dos leads vs historico
- **Creative Fatigue:**
  - Sinais: CTR caindo 3+ dias consecutivos, frequencia subindo, CPA subindo
  - Acao: pipeline de criativos novos (3-5 por semana), pausar saturados
  - Prevencao: nunca depender de 1-2 criativos, sempre ter 5+ ativos

**Por que importa:** Diagnosticar rapido e a diferenca entre perder R$500 e perder R$5.000. O gestor precisa de uma arvore de decisao clara para cada sintoma.

**Dados/conhecimento necessario:**
- Arvore de diagnostico completa (ja no DNA do Léo)
- Historico de performance para baseline
- Changelog de alteracoes na conta
- Dados de LP e comercial para diagnostico cross-funil

---

## 9. REPORTING E COMUNICACAO

### 9.1 Reporting para o Dono do Negocio

**Sub-habilidades:**
- **O que reportar:**
  - Investimento total
  - Leads gerados
  - Agendamentos
  - Vendas (se rastreavel)
  - ROAS / ROI
  - Comparativo com periodo anterior e com meta
  - 1-3 highlights (o que deu certo)
  - 1-3 alertas (o que precisa de atencao)
  - Proximos passos claros
- **O que NAO reportar:**
  - CPM, CPC, impressoes, alcance (metricas de meio)
  - Detalhes tecnicos de otimizacao
  - Jargao de plataforma
- **Tom e formato:**
  - Direto ao ponto: "Investimos R$10k e geramos R$120k" — primeira frase
  - Visual: graficos simples, tendencias claras
  - Contexto: "CPA subiu 15% porque estamos testando publicos novos para preparar a escala do proximo mes"
  - Acao: sempre terminar com "proximo passo"
- **Frequencia:**
  - Resumo diario: 3-5 linhas no WhatsApp (KPIs principais)
  - Relatorio semanal: detalhado, com analise e recomendacoes
  - Relatorio mensal: estrategico, com visao de negocio

**Por que importa:** Dono de negocio quer saber se o dinheiro ta voltando. Ele nao quer saber o CTR do ad set 3. Comunicacao errada = cliente insatisfeito mesmo com resultado bom.

**Dados/conhecimento necessario:**
- Meta de vendas do mes
- Budget aprovado
- Template de report para cada frequencia
- Canal de comunicacao preferido (WhatsApp, email, dashboard)

---

### 9.2 Reporting para o Gestor de Marketing

**Sub-habilidades:**
- **O que reportar (alem do basico):**
  - Breakdown por campanha, ad set e ad
  - Performance por publico e por criativo
  - Metricas de eficiencia: CTR, CPC, CVR, CPM
  - Testes em andamento e resultados
  - Status da fase de aprendizado
  - Sobreposicao de publico
  - Creative fatigue alerts
  - Recomendacoes tecnicas detalhadas
- **Formato:**
  - Tabela comparativa detalhada
  - Heatmap de performance (vermelho/amarelo/verde)
  - Graficos de tendencia (7 dias, 30 dias)
  - Changelog de otimizacoes executadas
- **Frequencia:**
  - Daily: relatorio automatizado
  - Weekly: reuniao de alinhamento + report detalhado
  - Monthly: review estrategico + planejamento proximo mes

**Por que importa:** O gestor de marketing precisa de dados para tomar decisoes taticas. Report superficial = ele nao confia e quer ver por conta propria. Report detalhado demais = ele se perde.

**Dados/conhecimento necessario:**
- Todas as metricas da plataforma
- Historico de otimizacoes executadas
- Status de cada teste
- Pipeline de criativos

---

### 9.3 Dashboards

**Sub-habilidades:**
- **KPIs no dashboard:**
  - Nivel 1 (topo): Investimento, Leads, CPA, ROAS, Vendas
  - Nivel 2: CTR, CPC, CPM, CVR, Frequencia
  - Nivel 3: Performance por campanha, por ad set, por ad
  - Nivel 4: Funil completo (impressao ate venda)
- **Visualizacoes essenciais:**
  - Grafico de linhas: tendencia de CPA e ROAS ao longo do tempo
  - Grafico de barras: comparativo de campanhas
  - Scorecard: KPIs principais com seta de tendencia
  - Tabela: top e bottom performers
  - Funil: taxas de conversao em cada etapa
  - Heatmap: performance por dia da semana e hora
- **Ferramentas:**
  - Google Looker Studio (gratis, conecta com Meta via Supermetrics/Funnel.io)
  - Custom dashboard (HTML/JS como ja existe no projeto)
  - Planilha Google Sheets com atualizacao automatica
- **Atualizacao:**
  - Tempo real: para monitoramento ativo
  - Diaria: para reports automatizados
  - Semanal: para dashboard estrategico

**Por que importa:** Dashboard e a forma mais rapida de entender o estado das campanhas. Sem dashboard, o gestor depende de entrar na plataforma toda vez — lento e sujeito a erro.

**Dados/conhecimento necessario:**
- Acesso a API para alimentar o dashboard
- Design de dashboard por perfil de usuario (dono vs gestor vs equipe)
- Alertas visuais para metricas fora do target

---

## 10. ESPECIFICO PARA INFOPRODUTOS/MENTORIAS

### 10.1 Particularidades do Nicho

**Sub-habilidades:**
- **Ciclo de venda longo:**
  - Mentoria high-ticket nao e compra por impulso
  - Ciclo medio: 7-30 dias entre primeiro contato e decisao
  - Implicacao para ads: retargeting longo (30-90 dias), nurture sequence
  - Atribuicao complexa: primeiro toque pode ser 30 dias antes da venda
- **Importancia da autoridade/prova social:**
  - Infoproduto vende confianca, nao produto fisico
  - Ads precisam CONSTRUIR autoridade, nao so gerar clique
  - Criativos de prova social (depoimentos, resultados, numeros) convertem mais
  - "Mais de 4.000 alunos e R$50M vendidos" = munição para ads
- **Sazonalidade de infoprodutos:**
  - Janeiro: baixo (pos-ferias, pouco dinheiro)
  - Fevereiro-Marco: retomada
  - Abril-Junho: bom (pre-meio do ano)
  - Julho: queda (ferias)
  - Agosto-Outubro: muito bom (preparacao fim de ano)
  - Novembro: Black Friday (pico)
  - Dezembro: queda (natal, ferias)
- **Competicao por atencao:**
  - Mercado de infoprodutos e MUITO competitivo em ads
  - Diferenciacao e essencial: o que torna a Zapeecomm unica?
  - Metodologia TRIA e o diferencial: explorar em criativos
  - Nicho especifico (Shopee/ML) e menos saturado que "renda extra genérico"

**Por que importa:** Ads de mentoria funcionam diferente de ads de e-commerce. Nao e compra por impulso. O gestor precisa entender a psicologia do comprador de mentoria.

**Dados/conhecimento necessario:**
- Ciclo de venda medio por produto
- Sazonalidade historica de vendas
- Diferenciais da Zapeecomm vs concorrentes
- Objecoes mais comuns mapeadas pelo comercial

---

### 10.2 Criativos Especificos para Mentorias

**Sub-habilidades:**
- **Tipos de criativo que funcionam:**
  - Depoimento de aluno (video): "Eu faturei R$200k em 4 meses..."
  - Resultado comprovado (print de dashboard Shopee): prova tangivel
  - Aula gratuita / micro-conteudo: gerar valor antes de pedir algo
  - Bastidores da mentoria: mostrar o que acontece "por dentro"
  - Storytelling do mentor: jornada do Neto de 0 a R$50M
  - Comparativo: "Antes da mentoria vs Depois da mentoria" (com cuidado legal)
  - Direto ao ponto: "Vagas abertas para [produto], aplique agora"
  - FAQ em video: responder as 3 objecoes principais em 60s
  - Carrossel de resultados: 5-10 cases de sucesso em um carrossel
- **Hooks que funcionam para mentorias de e-commerce:**
  - "Voce esta vendendo na Shopee do jeito errado"
  - "Como meu aluno saiu do zero e faturou R$200k em 4 meses"
  - "O metodo que 90% dos sellers nao conhecem"
  - "Eu investi R$X em Shopee Ads e o retorno foi de Y"
  - "3 erros que estao matando suas vendas na Shopee"
  - "Se voce vende menos de R$10k/mes na Shopee, assiste isso"
  - "Por que eu parei de [metodo antigo] e comecei a [metodo TRIA]"
- **Copy angles para cada produto:**
  - Aceleracao Shopee: transformacao, escala, acompanhamento, comunidade
  - Ultra Shopee: exclusividade, personalizacao, acesso direto, resultados premium
  - Shopee ADS 2.0: tecnico, rapido, ROI direto, ferramenta especifica

**Por que importa:** O criativo e a variavel #1 de performance em Meta Ads. Criativos genericos ("ganhe dinheiro online") nao convertem para mentoria especializada. Precisa falar a lingua do publico.

**Dados/conhecimento necessario:**
- Banco de criativos da conta com performance
- Depoimentos de alunos (video e texto)
- Screenshots de resultados de alunos
- Calendario editorial do Instagram do Neto (para alinhar ads com conteudo organico)

---

### 10.3 Funil Especifico Zapeecomm

**Sub-habilidades:**
- **Funil atual:** Ad -> LP/Form -> SDR qualifica -> Closer fecha
- **Metricas-chave do funil Zapeecomm:**
  - CPL target: a definir por historico
  - Taxa de agendamento (lead -> call): benchmark 25-35%
  - Taxa de show-up (agendou -> apareceu): benchmark 60-75%
  - Taxa de fechamento (call -> venda): benchmark 15-25% para high-ticket
  - CPA venda = CPL / (taxa agend x taxa show x taxa fechamento)
- **Otimizacoes especificas:**
  - Se CPL baixo mas agendamento baixo: qualidade do lead ruim -> melhorar copy ou LP
  - Se agendamento bom mas show-up baixo: follow-up fraco -> melhorar lembretes (WhatsApp, email, SMS)
  - Se show-up bom mas fechamento baixo: script do closer fraco -> feedback para comercial
  - Se tudo ok mas volume baixo: budget ou publico insuficiente -> escalar
- **Integracao de dados:**
  - Meta Ads (CPL, CTR, etc.) + CRM (agendamento, show-up, fechamento)
  - UTMs em todos os ads para rastrear fonte ate a venda
  - Dashboard unificado mostrando funil completo

**Por que importa:** Cada etapa do funil e um multiplicador. Melhorar taxa de agendamento de 25% para 35% = 40% mais vendas com o MESMO budget de ads. O gestor precisa diagnosticar ONDE esta o gargalo.

**Dados/conhecimento necessario:**
- Dados historicos de cada etapa do funil
- UTMs configurados em todos os ads
- Acesso ao CRM ou relatorios do comercial
- SLA de tempo de contato do SDR

---

## 11. AVANCADO E CUTTING EDGE

### 11.1 Advantage+ Shopping Campaigns (ASC)

**Sub-habilidades:**
- **Quando usar ASC:**
  - Conta com historico de conversao (50+ conversoes/semana)
  - Multiplos criativos variados (10-20+)
  - Quer escala broad sem microgerenciar publicos
  - Funciona para e-commerce e infoprodutos (se adaptar)
- **Configuracao otima:**
  - Existing customers cap: 20-30% (nao gastar tudo em retargeting)
  - Customer list para definir existing customers
  - Maximo 150 criativos (mas 10-20 de alta qualidade e melhor que 100 mediocres)
  - Nao permite exclusoes de publico (limitacao)
  - Nao permite manual placement (automatico)
- **Como testar:**
  - Rodar ASC paralelo a campanhas manuais
  - Budget inicial: 20% do total
  - Se CPA ASC < CPA manual por 7 dias: migrar mais budget
  - Se CPA ASC > CPA manual: revisar criativos, nao desistir no primeiro teste
- **Limitacoes:**
  - Nao mostra qual publico gerou a conversao
  - Nao permite exclusoes
  - Menos controle sobre distribuicao
  - Melhor para contas com alto volume

**Por que importa:** ASC e o futuro da Meta. Campanhas manuais vao perder relevancia progressivamente. O gestor precisa saber usar ASC agora para estar pronto quando for dominante.

---

### 11.2 Campanhas de Conversao no WhatsApp

**Sub-habilidades:**
- **Click-to-WhatsApp Ads:**
  - Objetivo: Engagement > Messaging > WhatsApp
  - CTA leva diretamente para conversa no WhatsApp
  - Mensagem pre-preenchida: configurar texto que aparece ao abrir a conversa
  - Vantagem: elimina LP, conversa direta, alta taxa de resposta
  - Desvantagem: precisa de equipe para responder rapido, nao escala facil
- **WhatsApp Conversion Campaign:**
  - Objetivo: Leads ou Sales com Conversion Location: WhatsApp
  - Otimiza para conversoes dentro da conversa (nao so abertura)
  - Precisa de WhatsApp Business API + Conversions API
  - Eventos: message_open, message_reply, lead, purchase
- **Best practices:**
  - Mensagem de boas-vindas clara e amigavel
  - Responder em < 5 minutos (senao o lead esfria)
  - Qualificar via mensagem antes de agendar call
  - Chatbot + humano: chatbot para qualificacao inicial, humano para fechar
- **Metricas especificas:**
  - Custo por conversa iniciada
  - Taxa de resposta (quantos % respondem a primeira mensagem)
  - Taxa de qualificacao (quantos % sao leads quentes)
  - Custo por lead qualificado via WhatsApp

**Por que importa:** WhatsApp e o canal de comunicacao #1 no Brasil. Para mentorias high-ticket, conversa direta no WhatsApp pode ter taxa de conversao 2-5x maior que LP + formulario. E uma oportunidade enorme para a Zapeecomm.

**Dados/conhecimento necessario:**
- Setup de WhatsApp Business API
- Templates de mensagem aprovados
- SLA de resposta da equipe
- Integracao com CRM via API

---

### 11.3 Instagram Reels Ads

**Sub-habilidades:**
- **Especificacoes:**
  - Formato: 9:16 vertical
  - Duracao: 5-90 segundos (recomendado 15-30s)
  - Texto: headline + texto primario aparecem embaixo
  - CTA button overlay
  - Audio: essencial (90% dos Reels sao vistos com som)
- **Best practices:**
  - Primeiros 3 segundos = tudo (hook visual + texto)
  - Formato UGC/nativo: parecer conteudo organico, nao anuncio
  - Transicoes rapidas (cortes a cada 2-3 segundos)
  - Texto na tela (muitos tambem veem sem som, apesar do audio)
  - Tendencias de audio: usar audios populares quando possivel
  - CTA nativo: "Arrasta pra cima" ou equivalente natural
- **Performance:**
  - CPM tipicamente menor que Feed
  - CTR pode ser menor (experiencia de scroll)
  - Mas CPA pode ser igual ou menor (publico mais engajado)
  - Funciona especialmente bem para awareness e consideracao

**Por que importa:** Reels e o posicionamento de maior crescimento do Instagram. Quem domina Reels Ads tem vantagem competitiva enorme em CPM e alcance.

**Dados/conhecimento necessario:**
- Benchmarks de performance de Reels Ads vs Feed vs Stories
- Library de criativos em formato 9:16
- Tendencias de audio e formato atuais

---

### 11.4 AI-Generated Variations e Advantage+ Creative

**Sub-habilidades:**
- **Advantage+ Creative Optimizations:**
  - Standard Enhancements: brilho, contraste, crop automatico
  - Text Variations: Meta gera variacoes do texto automaticamente
  - Music: adiciona musica automaticamente em videos
  - 3D Animation: efeito de profundidade em imagens
  - Visual Touchups: melhoria automatica de imagem
- **Quando ativar vs desativar:**
  - Ativar: quando quer testar rapidamente sem producao
  - Desativar: quando o criativo e cuidadosamente produzido e qualquer alteracao estraga
  - Testar: A/B com e sem Advantage+ Creative para ver impacto
- **AI Sandbox da Meta:**
  - Geracao de backgrounds automaticos
  - Expansao de imagem (outpainting)
  - Variacao de texto por IA
  - Status: em rollout, disponibilidade variavel
- **Dynamic Creative Optimization (DCO):**
  - Combina automaticamente elementos (imagem, texto, headline, CTA, descricao)
  - Meta testa combinacoes e otimiza para a melhor
  - Diferente de Flexible Ads: DCO e mais antigo, Flexible e mais novo
  - Quando usar: fase de teste, muitas variacoes para testar

**Por que importa:** IA generativa esta transformando a producao criativa. O gestor que usa AI para gerar variacoes rapidamente testa mais, aprende mais rapido, e encontra winners antes da concorrencia.

**Dados/conhecimento necessario:**
- Status das features de AI da Meta (quais estao disponiveis na conta)
- Resultados de testes com e sem AI enhancements
- Best practices para usar AI como complemento (nao substituto) de producao

---

## 12. AUTOMACAO E REGRAS

### 12.1 Regras Automatizadas Nativas

**Sub-habilidades:**
- **Regras de protecao (kill rules):**
  - Pausar ad set se CPA > 2x target nos ultimos 3 dias com > R$100 gasto
  - Pausar ad se CTR < 0.5% nos ultimos 3 dias com > 1000 impressoes
  - Pausar ad set se frequencia > 4.0 nos ultimos 7 dias
  - Notificar se CPA > 1.5x target em qualquer campanha
- **Regras de escala:**
  - Aumentar budget em 20% se CPA < target nos ultimos 3 dias e spend > R$50
  - Diminuir budget em 20% se CPA > 1.5x target nos ultimos 3 dias
- **Regras de budget:**
  - Nao deixar budget total do dia ultrapassar R$X
  - Resetar budget no inicio de cada semana para valor padrao
- **Regras de schedule:**
  - Ligar campanhas as 6h, desligar as 23h
  - Reduzir budget em 50% aos domingos (se performance historica e pior)
- **Configuracao de regras:**
  - Frequencia de checagem: a cada 30 min, a cada hora, diariamente
  - Janela de lookback: ultimas 24h, 3 dias, 7 dias
  - Action limits: maximo de acoes por periodo
  - Notificacoes: email quando regra e ativada
- **Limitacoes das regras nativas:**
  - Maximo de 250 regras por conta
  - Checagem nao e em tempo real (minimo 30 min)
  - Logica limitada (nao combina AND complexos)
  - Nao pode criar campanhas/ads automaticamente

**Por que importa:** Regras automatizadas sao a diferenca entre perder R$500 enquanto dorme e ter a campanha se auto-protegendo. Toda conta deveria ter pelo menos 5-10 regras ativas.

**Dados/conhecimento necessario:**
- Lista de regras ativas na conta
- Thresholds de CPA/CTR/frequencia por campanha
- Historico de ativacoes de regras

---

### 12.2 Automacao via API

**Sub-habilidades:**
- **Meta Marketing API:**
  - Endpoints: campanhas, ad sets, ads, insights, audiences, reports
  - Rate limits: 200 calls/hora por ad account (Tier padrao)
  - Batch requests: agrupar multiplas chamadas
  - Webhooks: notificacoes em tempo real de eventos
- **Automacoes possiveis via API:**
  - Report automatizado diario (coletar insights e enviar via WhatsApp/email)
  - Budget management automatizado (mais sofisticado que regras nativas)
  - Creative rotation automatizada (pausar saturados, ativar novos)
  - Audience refresh automatizado (atualizar custom audiences)
  - Alerta inteligente (combinar multiplas condicoes)
  - Dashboard em tempo real alimentado por API
- **Integracao com ferramentas terceiras:**
  - Zapier/Make: automacao low-code
  - Supermetrics: dados para Looker Studio
  - Funnel.io: agregador de dados
  - Revealbot: regras avancadas
  - Madgicx: otimizacao por AI
  - AdEspresso: gerenciamento e testes

**Por que importa:** A API permite automacoes que as regras nativas nao suportam. Para contas com alto volume, automacao via API e essencial para nao depender de gerenciamento manual.

**Dados/conhecimento necessario:**
- Acesso a API (app_id, access_token, ad_account_id — ja configurados no .env)
- Conhecimento de endpoints e rate limits
- Scripts/ferramentas ja implementados no projeto

---

## 13. COMPLIANCE E POLITICA

### 13.1 Politicas de Anuncios da Meta

**Sub-habilidades:**
- **Categorias proibidas:**
  - Drogas ilegais
  - Armas, municao, explosivos
  - Tabaco e produtos relacionados
  - Suplementos nao seguros
  - Conteudo adulto
  - Produtos/servicos de terceiros (counterfeit)
  - Discriminacao
  - Praticas de negocios engañosos
- **Categorias restritas (permitido com restricoes):**
  - Alcool (restricao de idade)
  - Servicos de namoro
  - Jogos de azar/loteria
  - Farmacias online
  - Suplementos
  - Servicos financeiros e seguros
  - Cripto
  - Produtos de dieta/saude
  - **Especial Ad Categories:** credito, emprego, moradia, questoes sociais/politicas
    - Limitacoes: nao pode segmentar por idade, genero, CEP especifico
    - Se aplicar Special Category quando nao precisa: limita desnecessariamente
    - Se NAO aplicar quando precisa: reprovacao e restricao de conta
- **Claims e resultados:**
  - NAO pode: "Ganhe R$10.000 em 30 dias garantido"
  - PODE: "Nossos alunos alcancaram resultados como R$200k de faturamento"
  - Diferenca: resultado possivel (provado) vs garantia de resultado
  - Usar "resultados podem variar" como disclaimer
  - Before/After: permitido com restricoes (nao pode ser saude/corpo, mas pode ser resultado financeiro/negocio)
- **Clickbait e engagement bait:**
  - NAO pode: "Clique aqui AGORA!!!", "Compartilhe antes que removam!"
  - PODE: "Saiba mais sobre como escalar suas vendas"
  - Meta penaliza em delivery, nao necessariamente reprova
- **Experiencia pos-clique:**
  - LP nao pode ter pop-ups agressivos
  - LP precisa funcionar (sem erro 404, sem redirect enganoso)
  - LP precisa ser relevante para o que o ad prometeu
  - LP nao pode pedir dados excessivos sem justificativa

**Por que importa:** Reprovacao de ad = delay de 24-48h + revisão manual. Restricao de conta = pode parar TODAS as campanhas. Compliance nao e burocracia — e protecao do ativo mais valioso (a conta de ads).

**Dados/conhecimento necessario:**
- Meta Advertising Standards (documento oficial, atualizado regularmente)
- Historico de reprovacoes da conta da Zapeecomm
- Checklist de compliance pre-publicacao
- Exemplos de copy compliant para o nicho de mentorias

---

### 13.2 Boas Praticas de Compliance para Mentorias

**Sub-habilidades:**
- **Copy compliant para resultados financeiros:**
  - RUIM: "Ganhe R$100k por mes vendendo na Shopee"
  - BOM: "Descubra como nossos alunos estao faturando acima de R$100k/mes na Shopee"
  - RUIM: "Fique rico vendendo online"
  - BOM: "Construa um negocio lucrativo em marketplaces"
  - RUIM: "Resultado garantido ou seu dinheiro de volta" (Meta pode reprovar mesmo sendo verdade)
  - BOM: "Metodologia comprovada com mais de 4.000 alunos"
- **Depoimentos e prova social:**
  - Pode usar depoimentos reais com autorizacao
  - Nao pode inventar depoimentos ou exagerar resultados
  - Adicionar disclaimer: "Resultados individuais podem variar"
  - Cuidado com print de faturamento: proibido? Nao explicitamente, mas pode gerar revisao manual
- **Imagens e videos:**
  - Nao usar imagens de dinheiro/notas de forma sensacionalista
  - Nao usar "fake scarcity" visual (timers falsos, numeros inventados)
  - Usar pessoas reais (nao stock com aparencia de "lifestyle rico")
  - Cuidado com musica com copyright (Reels/Stories)

**Por que importa:** O nicho de infoprodutos/mentorias e um dos mais monitorados pela Meta por historico de abusos. Copy agressiva que funciona hoje pode gerar restricao de conta amanha.

**Dados/conhecimento necessario:**
- Lista de claims que ja foram reprovados na conta
- Templates de copy compliant testados e aprovados
- Politica de uso de depoimentos e provas sociais

---

## 14. META-HABILIDADES DO GESTOR

### 14.1 Pensamento Analitico

- Capacidade de decompor problemas complexos em componentes
- Correlacionar multiplas metricas para encontrar causa raiz
- Distinguir correlacao de causalidade (CPA subiu E criativo mudou, mas foi o criativo que causou?)
- Pensar em segunda e terceira ordem (se eu pausar esse ad set, o budget vai pro outro — o outro vai aguentar?)

### 14.2 Visao de Negocio

- Entender que ads e um MEIO, nao um fim
- Pensar em unit economics antes de pensar em ads
- Diagnosticar se o problema e de ads ou de negocio
- Recomendar parar de investir em ads quando a unidade economica nao suporta

### 14.3 Comunicacao Estrategica

- Traduzir dados tecnicos em linguagem de negocio
- Reportar bad news com solucao inclusa ("CPA subiu 40%, mas ja estamos testando 5 novos criativos que...")
- Saber quando escalar comunicacao vs resolver sozinho
- Alinhar expectativas: "resultado de ads leva 2-4 semanas para estabilizar"

### 14.4 Disciplina de Processo

- Nao fazer mudancas impulsivas (esperar dados suficientes)
- Documentar TUDO: cada mudanca, cada teste, cada resultado
- Seguir framework mesmo quando "sentir" que deveria fazer diferente
- Revisar e aprender com decisoes anteriores

### 14.5 Atualizacao Continua

- Plataforma muda a cada 2-3 meses (novas features, mudancas de UI, alteracoes de algoritmo)
- Acompanhar: blog oficial da Meta, Jon Loomer, Social Media Examiner, AdEspresso Blog
- Testar novas features assim que ficam disponiveis (early adopter advantage)
- Participar de comunidades (AdLeaks, Facebook Ad Buyers, grupos BR de trafego)

---

## RESUMO: MATRIZ DE PRIORIDADE DE SKILLS

| Prioridade | Skill | Justificativa |
|-----------|-------|---------------|
| P0 (Essencial) | Tracking (Pixel + CAPI) | Sem tracking nao existe otimizacao |
| P0 (Essencial) | Diagnostico de Performance | Identificar e resolver problemas = manter resultado |
| P0 (Essencial) | Analise de Metricas (CPA, ROAS, CTR, CVR) | Base de todas as decisoes |
| P0 (Essencial) | Compliance | Proteger a conta de ads |
| P1 (Muito Importante) | Estrutura de Campanha | Fundacao de tudo que vem depois |
| P1 (Muito Importante) | Creative Analysis | Criativo e o novo targeting |
| P1 (Muito Importante) | Budget Management | Alocar dinheiro corretamente |
| P1 (Muito Importante) | Retargeting | Menor CPA, maior CVR |
| P2 (Importante) | Testing Frameworks | Descobrir o que funciona |
| P2 (Importante) | Escala | Multiplicar resultado |
| P2 (Importante) | Reporting | Comunicar valor e manter alinhamento |
| P2 (Importante) | Funil Integration | Visao end-to-end |
| P3 (Diferencial) | Advantage+ / ASC | Futuro da plataforma |
| P3 (Diferencial) | WhatsApp Conversion Campaigns | Oportunidade enorme para BR |
| P3 (Diferencial) | Automacao via API | Eficiencia em escala |
| P3 (Diferencial) | Modelagem de Atribuicao | Decisoes mais precisas |
| P4 (Nice-to-Have) | Media Mix Modeling | Para operacoes multi-canal maduras |
| P4 (Nice-to-Have) | Incrementality Testing | Para validar valor real dos ads |
| P4 (Nice-to-Have) | AI-Generated Creative | Em evolucao, vantagem competitiva futura |

---

## GAP ANALYSIS vs AGENTE ATUAL (Leo)

### O que o Leo JA TEM:
- Diagnostico de performance (framework CPMC, RADAR-Ads)
- Escala (regra dos 20%, CBO graduation, horizontal/vertical)
- Creative testing (3:2:2)
- Kill rules
- Auditoria de conta
- Reporting (templates diario, semanal, mensal)
- Inteligencia competitiva basica
- Integracao com funil comercial basica
- API endpoints mapeados

### O que FALTA adicionar ao Leo:
1. **Compliance profundo** — checklist de politicas, copy compliant por nicho, process de apelacao
2. **Advantage+ Suite completa** — ASC, Advantage+ Creative, AI Sandbox, quando ativar/desativar cada um
3. **WhatsApp Conversion Campaigns** — setup, metricas especificas, integracao
4. **Atribuicao avancada** — reconciliacao multi-plataforma, incrementality, view-through analysis
5. **Analise estatistica** — significancia, tamanho de amostra, vieses cognitivos
6. **Cohort analysis** — por periodo, por fonte, por LTV
7. **Unit economics profundo** — LTV:CAC, payback period, break-even ROAS, contribution margin
8. **Retargeting avancado** — sequencial, por intencao, progressive exclusion, video viewer segmentation
9. **Landing page analysis** — message match, speed, bounce rate, scroll depth
10. **Reels Ads best practices** — formato especifico, hooks, tendencias
11. **Automacao via API avancada** — scripts especificos, integracao CRM, alertas inteligentes
12. **Sazonalidade** — calendario sazonal, ajustes de budget, planejamento antecipado
13. **Copy frameworks completos** — PASTOR, OATH, Star-Chain-Hook (alem de PAS/AIDA/BAB que ja tem)
14. **Custom Audiences avancadas** — engagement audiences por tipo, combinacoes, refresh strategy
15. **Pacing e cash flow** — pacing semanal/mensal, alinhamento com fluxo de caixa
16. **Funis alternativos** — webinar, VSL, challenge, tripwire (alem do funil de aplicacao atual)
17. **Dashboard interativo** — design de visualizacoes por perfil de usuario
18. **Metricas de video detalhadas** — curva de retencao, custo por quartil, correlacao completion-conversao
19. **Audience overlap tool** — analise sistematica de sobreposicao
20. **Regras automatizadas expandidas** — biblioteca completa de regras, regras de schedule, regras de budget semanal

---

> Este documento serve como blueprint para a construcao do agente de trafego mais completo possivel.
> Cada secao pode ser transformada em um modulo de conhecimento/skill do agente Leo.
> Priorizar implementacao pela Matriz de Prioridade (P0 -> P1 -> P2 -> P3 -> P4).
