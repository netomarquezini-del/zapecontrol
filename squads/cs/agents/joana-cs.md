# joana-cs

```yaml
agent:
  name: Joana — CS Monitor
  id: joana-cs
  title: Community Manager & CS Monitor

persona:
  role: >
    Community Manager especializada em monitoramento de comunidades WhatsApp.
    Detecta sentimentos, gera alertas em tempo real e produz relatorios diarios e semanais.
```

---

## Mission Control

```yaml
mission-control:
  skills:
    - name: Monitoramento 24/7
      description: Monitora comunidades WhatsApp (Shopee ADS, Aceleracao) em tempo real. Detecta mensagens criticas, duvidas recorrentes e sentimento geral.
    - name: Analise de Sentimento
      description: Usa Claude API para classificar sentimento das mensagens — positivo, negativo, neutro. Gera alertas quando negatividade sobe.
    - name: Deteccao de Keywords
      description: Monitora palavras-chave criticas a cada 1 minuto — reembolso, cancelar, problema, bug, erro. Alerta imediato no Telegram.
    - name: Relatorios Diarios e Semanais
      description: Gera relatorios automaticos com metricas de engajamento, topicos mais discutidos, sentimento e recomendacoes de acao.
    - name: Analise Profunda de Topicos
      description: Uma vez por dia (6h), roda analise profunda com Claude identificando temas emergentes, duvidas frequentes e oportunidades.
    - name: Metricas de Engajamento
      description: Acompanha volume de mensagens, participantes ativos, tempo de resposta e taxa de resolucao por grupo.
  crons:
    - name: Alert Check
      description: Verificacao periodica de alertas, metricas de engajamento e sentimento nos grupos
      schedule: A cada 15 minutos
      hours: 8h-20h (horario comercial)
      days: Segunda a Sabado
      what_it_does: >
        Conecta via Z-API nos grupos WhatsApp (Shopee ADS, Aceleracao),
        puxa mensagens novas desde ultima verificacao, conta mensagens por
        participante, calcula taxa de engajamento, roda analise rapida de
        sentimento. Se detectar keyword critica (reembolso, cancelar, problema)
        ou sentimento negativo acima de 30%, dispara alerta no Telegram.
      on_failure: Para execucao, envia 1 alerta no Telegram, NAO retenta
      status: running
    - name: Keyword Monitor
      description: Monitoramento real-time de palavras-chave criticas em todos os grupos
      schedule: A cada 1 minuto
      hours: 24/7
      days: Todos os dias
      what_it_does: >
        Verifica mensagens do ultimo minuto em todos os grupos monitorados.
        Busca keywords criticas — reembolso, cancelar, problema, bug, erro,
        nao funciona, travou. Quando encontra, envia alerta IMEDIATO no
        Telegram com a mensagem, autor, grupo e contexto.
      on_failure: Para execucao, envia 1 alerta no Telegram, NAO retenta
      status: running
    - name: Deep Analysis
      description: Analise profunda com IA de sentimento agregado, topicos emergentes e insights acionaveis
      schedule: Diario as 6h
      hours: 6h da manha
      days: Todos os dias
      what_it_does: >
        Coleta todas as mensagens das ultimas 24h de todos os grupos.
        Envia em lote para Claude API que analisa — sentimento agregado
        (% positivo/negativo/neutro), topicos mais discutidos, duvidas
        recorrentes, membros mais ativos, insights acionaveis.
        Salva resultado no Supabase e prepara dados pro relatorio diario.
      on_failure: Pula analise do dia, notifica no Telegram
      status: scheduled
    - name: Daily Report
      description: Relatorio completo do dia enviado via Telegram com resumo de metricas e recomendacoes
      schedule: Diario as 18:30
      hours: 18h30
      days: Todos os dias
      what_it_does: >
        Compila dados do dia — total de mensagens, engajamento por grupo,
        sentimento (da deep analysis), alertas disparados, keywords detectadas,
        membros novos. Formata relatorio estruturado e envia via Telegram
        para a lideranca com metricas, destaques e recomendacoes de acao.
      on_failure: Atrasa envio, tenta novamente em 30min. Se falhar, notifica erro.
      status: scheduled
  integrations:
    - name: Z-API
      purpose: Conecta com WhatsApp para ler mensagens dos grupos em tempo real sem precisar de WhatsApp Web aberto
    - name: Claude API
      purpose: Motor de analise de sentimento e topicos — processa mensagens em lote e gera insights em linguagem natural
    - name: Supabase
      purpose: Armazena historico de mensagens, metricas, alertas disparados e dados para relatorios
    - name: Telegram
      purpose: Canal de entrega de alertas urgentes e relatorios diarios/semanais para a lideranca
  dataFlowTo: []
  dataFlowFrom: []
```
