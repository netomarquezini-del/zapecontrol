/**
 * Rules Engine — Motor de Regras Operacionais v2
 *
 * Modelo: Andromeda + CBO (Template 31/03/2026)
 * Implementa TODAS as regras de template-campanha-teste.md + template-campanha-escala.md
 *
 * KILL RULES (TESTE):
 * - 2x CPA target + ZERO conversão → pausa imediato (mín 1.000 imp)
 * - 1.5x CPA target + 1 conversão → monitora 48h
 * - CPA 50%+ acima por 5 dias → pausa
 * - Frequência > 3.5 + CTR caindo → pausa
 * - CTR caiu 30%+ vs primeiros 3 dias → pausa
 *
 * KILL RULES (ESCALA — mais tolerante):
 * - CPA 50%+ acima por 5 dias → pausa
 * - CPA 3x target com 2.000+ imp → arquiva
 * - Frequência > 3.5 + CTR caindo → pausa
 *
 * BUDGET RULES (ambas):
 * - Dias 1-5: INTOCÁVEL (aprendizado Andromeda)
 * - Dia 6+: ±15% diário baseado em CPA médio 3 dias
 *
 * GRADUAÇÃO:
 * - 5+ compras + CPA ≤ target por 3-5 dias + 1.000 imp → winner
 * - Duplicar pra escala com MESMO Post ID (prova social)
 *
 * ALERTAS:
 * - ROAS escala < 1.0 (prejuízo)
 * - Frequência > 3.0 (atenção) / > 3.5 (ação)
 * - Poucos criativos na campanha
 * - Campanha lotou (15 criativos)
 *
 * Autonomia:
 * - EXECUTA SEM PEDIR: kill rules, ±15% budget, análises
 * - PEDE CONFIRMAÇÃO: criar campanha nova, subir criativos
 */

const fs = require('fs');
const path = require('path');

const ANALYSES_DIR = path.join(__dirname, '..', '..', 'data', 'analises-ads');

// Guardrails
// ============================================================
// REGRAS v2 — Template Teste + Escala (31/03/2026)
// Validado por Neto + gerente de conta Meta
// ============================================================
const RULES = {
  // Budget
  BUDGET_CHANGE_PCT: 0.15,    // 15% mudança (era 20%)
  BUDGET_TEST: 1000,          // R$1.000/dia por campanha de teste
  BUDGET_WINDOW_DAYS: 3,      // Janela de 3 dias para decisão de budget
  BUDGET_FREEZE_DAYS: 5,      // Dias 1-5: intocável (aprendizado)

  // Kill Rules
  CPA_KILL_MULTIPLIER: 2.0,   // 2x CPA target sem conversão = pausa imediata
  CPA_MONITOR_MULTIPLIER: 1.5,// 1.5x CPA target com 1 conversão = monitora 48h
  CPA_HIGH_DAYS: 5,           // CPA 50%+ acima por 5 dias = pausa
  MIN_IMPRESSIONS: 1000,      // Mínimo impressões antes de julgar
  FREQ_KILL: 3.5,             // Frequência + CTR caindo = pausa
  CTR_DROP_PCT: 0.30,         // CTR caiu 30% vs primeiros 3 dias = pausa

  // Graduação (teste → escala)
  GRAD_CPA_DAYS: 3,           // CPA ≤ target por 3-5 dias
  GRAD_MIN_PURCHASES: 5,      // Mínimo 5 compras
  GRAD_MIN_IMPRESSIONS: 1000, // Mínimo 1.000 impressões

  // Criativos
  MAX_CRIATIVOS_CAMPANHA: 15, // Máximo 15 por campanha (gerente Meta: máx 20, Neto: 15)
  MIN_CRIATIVOS_CAMPANHA: 3,  // Mínimo 3 por campanha

  // Escala — Kill rules mais tolerantes
  ESCALA_CPA_HIGH_DAYS: 5,    // Na escala, 5 dias acima do target pra pausar (mais paciente)
  ESCALA_CPA_KILL_MULT: 3.0,  // 3x CPA target = arquiva (na teste é 2x)
  ESCALA_FREQ_KILL: 3.5,      // Freq > 3.5 + CTR caindo = pausa
  ESCALA_MIN_KILL_IMP: 2000,  // 2.000 imp pra arquivar na escala

  // Janelas de análise
  WINDOW_BUDGET: 3,           // 3 dias — decisão de budget
  WINDOW_KILL: 5,             // 5 dias — kill rule de criativo
  WINDOW_WEEKLY: 7,           // 7 dias — análise semanal

  // Alertas
  MIN_CRIATIVOS_ALERTA: 6,    // Alerta se campanha teste < 6 criativos
  FREQ_ATENCAO: 3.0,          // Atenção quando freq > 3.0
};

class RulesEngine {
  constructor(options = {}) {
    this.apiClient = options.apiClient;
    this.telegramBot = options.telegramBot;
    this.campaignState = options.campaignState;
    this.engine = options.engine; // MetaAdsEngine (safety layer)
    this.escalaBuilder = options.escalaBuilder || null;
    this.dryRun = options.dryRun || false;

    // Ensure analyses directory exists
    if (!fs.existsSync(ANALYSES_DIR)) {
      fs.mkdirSync(ANALYSES_DIR, { recursive: true });
    }
  }

  // ============================================================
  // MAIN CHECK — Roda a cada hora
  // ============================================================

  async runAllChecks() {
    const timestamp = new Date().toISOString();
    console.log(`\n[RulesEngine] ═══ Checagem iniciada: ${timestamp} ═══`);

    const results = {
      timestamp,
      kills: [],
      budgetChanges: [],
      graduations: [],
      alerts: [],
      errors: []
    };

    try {
      // 1. Buscar dados atuais da Meta API
      const campaigns = await this.apiClient.getActiveCampaigns();

      if (!campaigns || campaigns.length === 0) {
        console.log('[RulesEngine] Nenhuma campanha ativa encontrada');
        return results;
      }

      // 2. Buscar insights por campanha (últimos 7 dias)
      const insights = await this._fetchInsightsByCampaign(campaigns);

      // 3. Atualizar state tracker
      this._updateStateFromCampaigns(campaigns);

      // 4. Processar cada campanha conforme tipo (v2 — Teste + Escala)
      for (const campaign of campaigns) {
        const type = this.campaignState.detectCampaignType(campaign.name, campaign.id);
        const state = this.campaignState.getCampaign(campaign.id);
        const campaignInsights = insights[campaign.id] || {};

        try {
          if (type === 'teste_criativo' || type === 'teste_publico' || type === 'teste') {
            await this._checkTestCampaignV2(campaign, state, campaignInsights, results);
          } else if (type === 'escala') {
            await this._checkEscalaCampaignV2(campaign, state, campaignInsights, results);
          }
        } catch (err) {
          results.errors.push({
            campaignId: campaign.id,
            name: campaign.name,
            error: err.message
          });
        }
      }

      // 5. Verificar alertas gerais
      await this._checkGeneralAlerts(campaigns, insights, results);

      // 6. Salvar state e análise
      this.campaignState.save();
      this._saveAnalysis(results);

      // 7. Reportar resultados
      await this._reportResults(results);

      console.log(`[RulesEngine] ═══ Checagem finalizada: ${results.kills.length} kills, ${(results.retries || []).length} retries, ${results.budgetChanges.length} budget changes, ${results.graduations.length} graduações, ${results.alerts.length} alertas ═══\n`);

    } catch (err) {
      console.error('[RulesEngine] Erro crítico:', err.message);
      results.errors.push({ global: err.message });
    }

    return results;
  }

  // ============================================================
  // V2 — CAMPANHA DE TESTE — Regras (Template 31/03/2026)
  // ============================================================

  async _checkTestCampaignV2(campaign, state, insights, results) {
    if (!state) return;

    const daysRunning = state.daysRunning;
    const budget = parseInt(campaign.daily_budget || campaign.lifetime_budget || 0) / 100;

    // Buscar ads ativos (não ad sets — novo modelo é 1 ad set com N ads)
    const ads = await this.apiClient.getActiveAds ? await this.apiClient.getActiveAds(campaign.id) : [];
    const adSets = await this.apiClient.getActiveAdSets(campaign.id);

    // ALERTA: Poucos criativos
    const activeAdCount = ads.length || adSets.length;
    if (activeAdCount < RULES.MIN_CRIATIVOS_ALERTA) {
      results.alerts.push({
        type: 'criativos_baixo',
        campaignId: campaign.id,
        name: campaign.name,
        count: activeAdCount,
        minimum: RULES.MIN_CRIATIVOS_ALERTA,
        message: `⚠️ Campanha teste "${campaign.name}" com apenas ${activeAdCount} criativos (mínimo recomendado: ${RULES.MIN_CRIATIVOS_ALERTA}). Acionar pipeline Max/Thomas/Maicon.`
      });
    }

    // ALERTA: Campanha lotou
    if (activeAdCount >= RULES.MAX_CRIATIVOS_CAMPANHA) {
      results.alerts.push({
        type: 'campanha_lotou',
        campaignId: campaign.id,
        name: campaign.name,
        count: activeAdCount,
        max: RULES.MAX_CRIATIVOS_CAMPANHA,
        message: `📋 Campanha teste "${campaign.name}" lotou (${activeAdCount}/${RULES.MAX_CRIATIVOS_CAMPANHA}). Se precisar subir novos: pausar pior ou criar nova campanha de teste.`
      });
    }

    // DIAS 1-5: Intocável para budget (aprendizado Andromeda)
    // Mas kill rules de criativos individuais RODAM a partir de 1.000 impressões

    // Checar cada ad/ad set para kill rules
    for (const adSet of adSets) {
      const adSetInsights = await this._fetchAdSetInsights(adSet.id);
      const adSetState = this.campaignState.updateAdSet(adSet.id, {
        name: adSet.name,
        campaignId: campaign.id,
        campaignType: 'teste',
        status: adSet.status
      });

      if (!adSetState) continue;

      const adDaysRunning = adSetState.daysRunning;
      const totalSpend = adSetInsights.totalSpend || 0;
      const totalPurchases = adSetInsights.totalPurchases || 0;
      const impressions = adSetInsights.impressions || 0;
      const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
      const frequency = adSetInsights.frequency || 0;
      const ctr = adSetInsights.ctr || 0;
      const ctrInitial = adSetInsights.ctrInitial || ctr; // CTR dos primeiros 3 dias
      const roas = adSetInsights.roas || {};

      // Regra: NUNCA julgar antes de 1.000 impressões
      if (impressions < RULES.MIN_IMPRESSIONS) {
        continue;
      }

      // KILL RULE #1: Gastou 2x CPA target, ZERO conversão → PAUSA IMEDIATO
      if (totalPurchases === 0 && this.cpaTarget && totalSpend >= this.cpaTarget * RULES.CPA_KILL_MULTIPLIER) {
        await this._killAdSet(adSet, campaign, results,
          `Kill #1: Gastou R$${totalSpend.toFixed(0)} (2x CPA target R$${this.cpaTarget}), ZERO conversão`
        );
        continue;
      }

      // KILL RULE #2: Gastou 1.5x CPA target, apenas 1 conversão → MONITORA 48h
      if (totalPurchases === 1 && this.cpaTarget && totalSpend >= this.cpaTarget * RULES.CPA_MONITOR_MULTIPLIER) {
        results.alerts.push({
          type: 'cpa_monitor',
          adSetId: adSet.id,
          name: adSet.name,
          message: `⏳ MONITORA 48h: "${adSet.name}" gastou R$${totalSpend.toFixed(0)} com 1 conversão (1.5x CPA target)`
        });
        continue;
      }

      // KILL RULE #3: CPA 50%+ acima do target por 5 dias → PAUSA
      if (adDaysRunning >= RULES.CPA_HIGH_DAYS && this.cpaTarget && cpa > this.cpaTarget * 1.5) {
        await this._killAdSet(adSet, campaign, results,
          `Kill #3: CPA R$${cpa.toFixed(0)} (50%+ acima target R$${this.cpaTarget}) por ${adDaysRunning} dias`
        );
        continue;
      }

      // KILL RULE #4: Frequência > 3.5 + CTR caindo → PAUSA
      if (frequency > RULES.FREQ_KILL && ctrInitial > 0 && ctr < ctrInitial * (1 - RULES.CTR_DROP_PCT)) {
        await this._killAdSet(adSet, campaign, results,
          `Kill #4: Frequência ${frequency.toFixed(1)} + CTR caiu ${((1 - ctr/ctrInitial) * 100).toFixed(0)}% — saturação`
        );
        continue;
      }

      // KILL RULE #5: CTR caiu 30%+ vs primeiros 3 dias → PAUSA
      if (adDaysRunning > 3 && ctrInitial > 0 && ctr < ctrInitial * (1 - RULES.CTR_DROP_PCT)) {
        await this._killAdSet(adSet, campaign, results,
          `Kill #5: CTR caiu ${((1 - ctr/ctrInitial) * 100).toFixed(0)}% vs primeiros 3 dias — creative fatigue`
        );
        continue;
      }

      // GRADUAÇÃO: CPA ≤ target por 3-5 dias + 5 compras + 1.000 imp
      if (totalPurchases >= RULES.GRAD_MIN_PURCHASES
          && impressions >= RULES.GRAD_MIN_IMPRESSIONS
          && adDaysRunning >= RULES.GRAD_CPA_DAYS
          && this.cpaTarget && cpa <= this.cpaTarget) {
        results.graduations.push({
          type: 'graduation',
          adSetId: adSet.id,
          adSetName: adSet.name,
          campaignId: campaign.id,
          campaignName: campaign.name,
          purchases: totalPurchases,
          cpa,
          roas: roas.cumulative || 0,
          message: `🏅 WINNER: "${adSet.name}" — ${totalPurchases} compras, CPA R$${cpa.toFixed(0)}, ROAS ${(roas.cumulative || 0).toFixed(2)}x. Duplicar pra escala com mesmo Post ID!`
        });

        this.campaignState.recordAction(adSet.id, 'adSet', {
          type: 'graduation',
          reason: `${totalPurchases} compras + CPA R$${cpa.toFixed(0)}`,
          details: { purchases: totalPurchases, cpa, roas: roas.cumulative }
        });
      }

      // ALERTA: Frequência > 3.0 (atenção)
      if (frequency > RULES.FREQ_ATENCAO && frequency <= RULES.FREQ_KILL) {
        results.alerts.push({
          type: 'freq_atencao',
          adSetId: adSet.id,
          name: adSet.name,
          message: `⚠️ Frequência ${frequency.toFixed(1)} em "${adSet.name}" — preparar conceitos novos`
        });
      }
    }

    // BUDGET DA CAMPANHA DE TESTE — dia 6+ otimização diária ±15%
    if (daysRunning > RULES.BUDGET_FREEZE_DAYS) {
      await this._adjustBudgetV2(campaign, insights, budget, results);
    }
  }

  // ============================================================
  // V2 — CAMPANHA DE ESCALA — Regras (Template 31/03/2026)
  // ============================================================

  async _checkEscalaCampaignV2(campaign, state, insights, results) {
    if (!state) return;

    const daysRunning = state.daysRunning;
    const budget = parseInt(campaign.daily_budget || campaign.lifetime_budget || 0) / 100;

    // Buscar ads/ad sets
    const adSets = await this.apiClient.getActiveAdSets(campaign.id);

    // ALERTA: Poucos winners
    if (adSets.length < RULES.MIN_CRIATIVOS_CAMPANHA) {
      results.alerts.push({
        type: 'winners_baixo',
        campaignId: campaign.id,
        name: campaign.name,
        count: adSets.length,
        message: `⚠️ Escala "${campaign.name}" com apenas ${adSets.length} winners. Precisa de mais graduações da teste.`
      });
    }

    // Checar cada winner — kill rules mais tolerantes
    for (const adSet of adSets) {
      const adSetInsights = await this._fetchAdSetInsights(adSet.id);
      const adSetState = this.campaignState.updateAdSet(adSet.id, {
        name: adSet.name,
        campaignId: campaign.id,
        campaignType: 'escala',
        status: adSet.status
      });

      if (!adSetState) continue;

      const adDaysRunning = adSetState.daysRunning;
      const totalSpend = adSetInsights.totalSpend || 0;
      const totalPurchases = adSetInsights.totalPurchases || 0;
      const impressions = adSetInsights.impressions || 0;
      const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
      const frequency = adSetInsights.frequency || 0;
      const ctr = adSetInsights.ctr || 0;
      const ctrInitial = adSetInsights.ctrInitial || ctr;

      // ESCALA KILL #1: CPA 50%+ acima por 5 dias → PAUSA (mais paciente que teste)
      if (adDaysRunning >= RULES.ESCALA_CPA_HIGH_DAYS && this.cpaTarget && cpa > this.cpaTarget * 1.5) {
        await this._killAdSet(adSet, campaign, results,
          `Kill Escala: CPA R$${cpa.toFixed(0)} (50%+ acima target) por ${adDaysRunning} dias`
        );
        continue;
      }

      // ESCALA KILL #2: CPA 3x target com 2.000+ impressões → ARQUIVA
      if (impressions >= RULES.ESCALA_MIN_KILL_IMP && this.cpaTarget && cpa > this.cpaTarget * RULES.ESCALA_CPA_KILL_MULT) {
        await this._killAdSet(adSet, campaign, results,
          `Arquiva Escala: CPA R$${cpa.toFixed(0)} (3x target R$${this.cpaTarget}) com ${impressions} impressões`
        );
        continue;
      }

      // ESCALA KILL #3: Frequência > 3.5 + CTR caindo → PAUSA
      if (frequency > RULES.ESCALA_FREQ_KILL && ctrInitial > 0 && ctr < ctrInitial * (1 - RULES.CTR_DROP_PCT)) {
        await this._killAdSet(adSet, campaign, results,
          `Kill Escala: Frequência ${frequency.toFixed(1)} + CTR caiu — winner saturou, pode voltar em 2-3 semanas`
        );
        continue;
      }

      // ALERTA: Frequência subindo
      if (frequency > RULES.FREQ_ATENCAO) {
        results.alerts.push({
          type: 'freq_escala',
          adSetId: adSet.id,
          name: adSet.name,
          message: `⚠️ Winner "${adSet.name}" freq ${frequency.toFixed(1)} — trazer novos winners da teste`
        });
      }
    }

    // BUDGET DA ESCALA — dia 6+ otimização diária ±15%
    if (daysRunning > RULES.BUDGET_FREEZE_DAYS) {
      await this._adjustBudgetV2(campaign, insights, budget, results);
    }
  }

  // ============================================================
  // RETRY ESCALA — Libera winners e recria campanha após kill
  // ============================================================

  async _retryEscalaAfterKill(killedCampaign, results) {
    if (!this.escalaBuilder) {
      console.log('[RulesEngine] EscalaBuilder não disponível — retry ignorado');
      return;
    }

    // 1. Encontrar a escala killada no pool e liberar os winners
    const pool = this.escalaBuilder._loadPool();
    const escalaRecord = (pool.escalasCreated || []).find(
      e => e.campaignId === killedCampaign.id
    );

    if (!escalaRecord) {
      console.log(`[RulesEngine] Escala ${killedCampaign.id} não encontrada no pool — retry ignorado`);
      return;
    }

    const publicoKey = escalaRecord.publicoKey || 'broad';

    // Liberar os winners dessa escala (remover o publicoKey do usedInEscalas)
    let freedCount = 0;
    for (const winner of pool.winners) {
      const idx = winner.usedInEscalas.indexOf(publicoKey);
      if (idx !== -1) {
        // Verificar se esse winner era dessa escala específica
        const wasInThisEscala = (escalaRecord.winners || []).some(
          ew => ew.creativeId === winner.creativeId
        );
        if (wasInThisEscala) {
          winner.usedInEscalas.splice(idx, 1);
          freedCount++;
        }
      }
    }

    // Marcar escala como killada no histórico
    escalaRecord.killedAt = new Date().toISOString();
    escalaRecord.killedReason = killedCampaign.name;

    // Salvar pool atualizado
    this.escalaBuilder.pool = pool;
    this.escalaBuilder._savePool();

    console.log(`[RulesEngine] ${freedCount} winners liberados da escala killada "${killedCampaign.name}"`);

    // 2. Checar se pode recriar imediatamente
    const check = this.escalaBuilder.canCreateEscala(publicoKey);
    if (!check.canCreate) {
      console.log(`[RulesEngine] Não tem winners suficientes pra recriar: ${check.available}/${check.minimum}`);
      return;
    }

    // 3. Recriar campanha de escala
    console.log(`[RulesEngine] Recriando escala com ${check.available} winners...`);

    try {
      const newEscala = await this.escalaBuilder.createEscalaCampaign(publicoKey);
      if (newEscala) {
        results.retries = results.retries || [];
        results.retries.push({
          type: 'escala_retry',
          killedCampaignId: killedCampaign.id,
          killedCampaignName: killedCampaign.name,
          newCampaignId: newEscala.campaignId,
          newCampaignName: newEscala.campaignName,
          winners: newEscala.creatives,
          message: `🔄 RETRY ESCALA: "${killedCampaign.name}" killada → nova "${newEscala.campaignName}" criada com ${newEscala.creatives} criativos`
        });
        console.log(`[RulesEngine] ✅ Nova escala criada: ${newEscala.campaignName}`);
      }
    } catch (err) {
      console.error(`[RulesEngine] ❌ Erro ao recriar escala: ${err.message}`);
      results.errors.push({
        campaignId: killedCampaign.id,
        name: killedCampaign.name,
        error: `Retry escala falhou: ${err.message}`
      });
    }
  }

  // ============================================================
  // BUDGET ADJUSTMENT (LEGACY — mantido para compatibilidade)
  // ============================================================

  async _adjustBudget(campaign, roas, period, currentBudget, results) {
    // Redireciona para V2
    return this._adjustBudgetV2(campaign, { roas3d: roas }, currentBudget, results);
  }

  // ============================================================
  // BUDGET ADJUSTMENT V2 — 15% diário, janela 3 dias
  // A partir do dia 6 (dias 1-5 intocável)
  // ============================================================

  async _adjustBudgetV2(campaign, insights, currentBudget, results) {
    // Usar janela de 3 dias para decisão
    const cpa3d = insights.cpa3d || 0;
    const roas3d = insights.roas3d || 0;

    // Se não tem CPA target definido, não ajusta
    if (!this.cpaTarget) {
      return;
    }

    let action = 'maintain'; // maintain, increase, decrease

    if (cpa3d > 0 && cpa3d <= this.cpaTarget) {
      // CPA médio 3d ≤ target → SOBE 15%
      action = 'increase';
    } else if (cpa3d > this.cpaTarget * 1.2) {
      // CPA médio 3d > 20% acima do target → DESCE 15%
      action = 'decrease';
    }
    // CPA entre target e +20% → MANTÉM

    if (action === 'maintain') {
      return; // Não faz nada
    }

    const pct = RULES.BUDGET_CHANGE_PCT; // 0.15 = 15%
    const newBudget = action === 'increase'
      ? Math.round(currentBudget * (1 + pct))
      : Math.round(currentBudget * (1 - pct));

    const period = `${RULES.BUDGET_WINDOW_DAYS}d`;

    await this._executeBudgetChange(campaign, currentBudget, newBudget, action === 'increase' ? 'increase' : 'decrease', cpa3d, period, results);
  }

  async _executeBudgetChange(campaign, oldBudget, newBudget, direction, roas, period, results) {
    const action = direction === 'increase' ? 'Sobe' : 'Abaixa';
    const emoji = direction === 'increase' ? '🟢' : '🔴';

    const change = {
      type: `budget_${direction}`,
      campaignId: campaign.id,
      campaignName: campaign.name,
      oldBudget,
      newBudget,
      roas,
      period,
      message: `${emoji} ${action} budget "${campaign.name}": R$${oldBudget} → R$${newBudget} (ROAS ${period}: ${roas.toFixed(2)})`
    };

    if (!this.dryRun) {
      try {
        await this.apiClient.updateBudget(campaign.id, newBudget * 100, 'daily'); // centavos
        change.executed = true;
        console.log(`[RulesEngine] ${change.message}`);
      } catch (err) {
        change.executed = false;
        change.error = err.message;
        console.error(`[RulesEngine] Erro ao ${action.toLowerCase()} budget:`, err.message);
      }
    } else {
      change.executed = false;
      change.dryRun = true;
      console.log(`[RulesEngine] [DRY RUN] ${change.message}`);
    }

    results.budgetChanges.push(change);

    this.campaignState.recordAction(campaign.id, 'campaign', {
      type: `budget_${direction}`,
      reason: `ROAS ${period}: ${roas.toFixed(2)}`,
      details: { oldBudget, newBudget }
    });
  }

  // ============================================================
  // KILL ACTIONS
  // ============================================================

  async _killAdSet(adSet, campaign, results, reason) {
    const kill = {
      type: 'kill_adset',
      adSetId: adSet.id,
      adSetName: adSet.name,
      campaignId: campaign.id,
      campaignName: campaign.name,
      reason,
      message: `🔴 KILL: "${adSet.name}" (${campaign.name}) — ${reason}`
    };

    if (!this.dryRun) {
      try {
        if (this.engine) {
          await this.engine.executeWrite('pause_adset', { adSetId: adSet.id }, async () => {
            return this.apiClient.pauseAdSet(adSet.id);
          });
        } else {
          await this.apiClient.pauseAdSet(adSet.id);
        }
        kill.executed = true;
        console.log(`[RulesEngine] ${kill.message}`);
      } catch (err) {
        kill.executed = false;
        kill.error = err.message;
        console.error(`[RulesEngine] Erro ao pausar ad set:`, err.message);
      }
    } else {
      kill.executed = false;
      kill.dryRun = true;
      console.log(`[RulesEngine] [DRY RUN] ${kill.message}`);
    }

    results.kills.push(kill);

    this.campaignState.markPaused(adSet.id, 'adSet', reason);
    this.campaignState.recordAction(adSet.id, 'adSet', {
      type: 'kill',
      reason,
      details: {}
    });
  }

  async _killCampaign(campaign, results, reason) {
    const kill = {
      type: 'kill_campaign',
      campaignId: campaign.id,
      campaignName: campaign.name,
      reason,
      message: `🔴 KILL CAMPANHA: "${campaign.name}" — ${reason}`
    };

    if (!this.dryRun) {
      try {
        if (this.engine) {
          await this.engine.executeWrite('pause_campaign', { campaignId: campaign.id }, async () => {
            return this.apiClient.pauseCampaign(campaign.id);
          });
        } else {
          await this.apiClient.pauseCampaign(campaign.id);
        }
        kill.executed = true;
        console.log(`[RulesEngine] ${kill.message}`);
      } catch (err) {
        kill.executed = false;
        kill.error = err.message;
        console.error(`[RulesEngine] Erro ao pausar campanha:`, err.message);
      }
    } else {
      kill.executed = false;
      kill.dryRun = true;
      console.log(`[RulesEngine] [DRY RUN] ${kill.message}`);
    }

    results.kills.push(kill);

    this.campaignState.markPaused(campaign.id, 'campaign', reason);
    this.campaignState.recordAction(campaign.id, 'campaign', {
      type: 'kill',
      reason,
      details: {}
    });
  }

  // ============================================================
  // ALERTAS GERAIS
  // ============================================================

  async _checkGeneralAlerts(campaigns, insights, results) {
    for (const campaign of campaigns) {
      const type = this.campaignState.detectCampaignType(campaign.name, campaign.id);
      const ci = insights[campaign.id] || {};

      // Alerta: ROAS escala < 1.0 (prejuízo)
      if (type === 'escala') {
        const roas7d = ci.roas7d || ci.roas3d || 0;
        if (roas7d > 0 && roas7d < 1.0) {
          results.alerts.push({
            type: 'roas_prejuizo',
            campaignId: campaign.id,
            name: campaign.name,
            roas: roas7d,
            message: `🚨 PREJUÍZO: "${campaign.name}" ROAS ${roas7d.toFixed(2)}x — gastando mais do que fatura!`
          });
        }

        // Alerta: budget muito baixo na escala (poucos dados pro Andromeda)
        const budget = parseInt(campaign.daily_budget || 0) / 100;
        if (budget > 0 && budget < 200) {
          results.alerts.push({
            type: 'budget_baixo_escala',
            campaignId: campaign.id,
            name: campaign.name,
            budget,
            message: `⚠️ Budget escala "${campaign.name}" em R$${budget.toFixed(0)} — baixo pra Andromeda otimizar (considerar escalar se CPA ok)`
          });
        }
      }
    }
  }

  // ============================================================
  // DATA FETCHING HELPERS
  // ============================================================

  async _fetchInsightsByCampaign(campaigns) {
    const insights = {};

    try {
      // Fetch últimos 7 dias por campanha
      const data7d = await this.apiClient.getCampaignInsights('last_7d');
      const data3d = await this.apiClient.getCampaignInsights('last_3d');
      const dataYesterday = await this.apiClient.getCampaignInsights('yesterday');

      // Agrupar por campaign_id
      for (const d of data7d) {
        if (!insights[d.campaign_id]) insights[d.campaign_id] = {};
        const spend = Number(d.spend || 0);
        const purchases = this._getActionCount(d.actions, 'purchase');
        const revenue = this._getActionValue(d.action_values, 'offsite_conversion.fb_pixel_purchase');
        insights[d.campaign_id].roas7d = spend > 0 ? revenue / spend : 0;
        insights[d.campaign_id].spend7d = spend;
        insights[d.campaign_id].purchases7d = purchases;
        insights[d.campaign_id].revenue7d = revenue;
      }

      for (const d of data3d) {
        if (!insights[d.campaign_id]) insights[d.campaign_id] = {};
        const spend = Number(d.spend || 0);
        const purchases = this._getActionCount(d.actions, 'purchase');
        const revenue = this._getActionValue(d.action_values, 'offsite_conversion.fb_pixel_purchase');
        insights[d.campaign_id].roas3d = spend > 0 ? revenue / spend : 0;
        insights[d.campaign_id].spend3d = spend;
        insights[d.campaign_id].purchases3d = purchases;
      }

      // Ontem (dia completo) — usado pra análise de dia 1 de escala
      for (const d of dataYesterday) {
        if (!insights[d.campaign_id]) insights[d.campaign_id] = {};
        const purchases = this._getActionCount(d.actions, 'purchase');
        const spend = Number(d.spend || 0);
        const revenue = this._getActionValue(d.action_values, 'offsite_conversion.fb_pixel_purchase');
        insights[d.campaign_id].yesterday = {
          spend,
          purchases,
          revenue,
          roas: spend > 0 ? revenue / spend : 0
        };
      }
    } catch (err) {
      console.error('[RulesEngine] Erro ao buscar insights:', err.message);
    }

    return insights;
  }

  async _fetchAdSetInsights(adSetId) {
    try {
      // Insights acumulados (lifetime) do ad set
      const result = await this.apiClient._get(`/${adSetId}/insights`, {
        fields: 'spend,actions,action_values',
        date_preset: 'maximum'
      });

      const data = (result.data && result.data[0]) || {};
      const totalSpend = Number(data.spend || 0);
      const totalPurchases = this._getActionCount(data.actions, 'purchase');
      const totalRevenue = this._getActionValue(data.action_values, 'offsite_conversion.fb_pixel_purchase');

      // Rolling 7d
      const result7d = await this.apiClient._get(`/${adSetId}/insights`, {
        fields: 'spend,actions,action_values',
        date_preset: 'last_7d'
      });
      const data7d = (result7d.data && result7d.data[0]) || {};
      const spend7d = Number(data7d.spend || 0);
      const revenue7d = this._getActionValue(data7d.action_values, 'offsite_conversion.fb_pixel_purchase');

      return {
        totalSpend,
        totalPurchases,
        totalRevenue,
        roas: {
          cumulative: totalSpend > 0 ? totalRevenue / totalSpend : 0,
          rolling7d: spend7d > 0 ? revenue7d / spend7d : 0
        }
      };
    } catch (err) {
      console.error(`[RulesEngine] Erro insights ad set ${adSetId}:`, err.message);
      return { totalSpend: 0, totalPurchases: 0, roas: {} };
    }
  }

  _getActionCount(actions, type) {
    if (!actions) return 0;
    const a = actions.find(a => a.action_type === type);
    return a ? Number(a.value) : 0;
  }

  _getActionValue(values, type) {
    if (!values) return 0;
    const v = values.find(v => v.action_type === type);
    return v ? Number(v.value) : 0;
  }

  // ============================================================
  // STATE UPDATE
  // ============================================================

  _updateStateFromCampaigns(campaigns) {
    for (const c of campaigns) {
      this.campaignState.updateCampaign(c.id, {
        name: c.name,
        status: c.status,
        dailyBudget: parseInt(c.daily_budget || 0) / 100
      });
    }
  }

  // ============================================================
  // ANÁLISE PERSISTENCE
  // ============================================================

  _saveAnalysis(results) {
    const now = new Date();
    const filename = `analysis-${now.toISOString().split('T')[0]}-${now.getHours().toString().padStart(2, '0')}h.json`;
    const filepath = path.join(ANALYSES_DIR, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
      console.log(`[RulesEngine] Análise salva: ${filename}`);
    } catch (err) {
      console.error('[RulesEngine] Erro ao salvar análise:', err.message);
    }

    // Manter apenas últimos 30 dias de análises
    this._cleanupOldAnalyses();
  }

  _cleanupOldAnalyses() {
    try {
      const files = fs.readdirSync(ANALYSES_DIR)
        .filter(f => f.startsWith('analysis-') && f.endsWith('.json'))
        .sort();

      // Manter últimos 720 arquivos (30 dias * 24 horas)
      if (files.length > 720) {
        const toDelete = files.slice(0, files.length - 720);
        toDelete.forEach(f => {
          fs.unlinkSync(path.join(ANALYSES_DIR, f));
        });
      }
    } catch (e) { /* ignore */ }
  }

  // ============================================================
  // TELEGRAM REPORTING
  // ============================================================

  async _reportResults(results) {
    if (!this.telegramBot) return;

    const retries = results.retries || [];
    const hasAction = results.kills.length > 0 || results.budgetChanges.length > 0
      || results.graduations.length > 0 || results.alerts.length > 0 || retries.length > 0;

    if (!hasAction) return; // Sem novidades, não envia

    const lines = ['📊 *Rules Engine — Relatório*', ''];

    // Kills
    if (results.kills.length > 0) {
      lines.push(`🔴 *KILLS (${results.kills.length}):*`);
      results.kills.forEach(k => {
        const status = k.executed ? '✅' : (k.dryRun ? '🔸DRY' : '❌');
        lines.push(`  ${status} ${k.adSetName || k.campaignName}`);
        lines.push(`     ${k.reason}`);
      });
      lines.push('');
    }

    // Budget changes
    if (results.budgetChanges.length > 0) {
      lines.push(`💰 *BUDGET (${results.budgetChanges.length}):*`);
      results.budgetChanges.forEach(b => {
        const emoji = b.type === 'budget_increase' ? '🟢' : '🔴';
        const status = b.executed ? '✅' : (b.dryRun ? '🔸DRY' : '❌');
        lines.push(`  ${emoji}${status} ${b.campaignName}`);
        lines.push(`     R$${b.oldBudget} → R$${b.newBudget} (ROAS ${b.period}: ${b.roas.toFixed(2)})`);
      });
      lines.push('');
    }

    // Graduations
    if (results.graduations.length > 0) {
      lines.push(`🏅 *GRADUAÇÕES (${results.graduations.length}):*`);
      results.graduations.forEach(g => {
        lines.push(`  ${g.adSetName}: ${g.purchases} vendas, ROAS ${g.roas.toFixed(2)}`);
        lines.push(`  ⚡ Pede confirmação pra criar campanha de escala`);
      });
      lines.push('');
    }

    // Alerts
    if (results.alerts.length > 0) {
      lines.push(`⚠️ *ALERTAS (${results.alerts.length}):*`);
      results.alerts.forEach(a => {
        lines.push(`  ${a.message}`);
      });
      lines.push('');
    }

    // Retries
    if (retries.length > 0) {
      lines.push(`🔄 *RETRY ESCALA (${retries.length}):*`);
      retries.forEach(r => {
        lines.push(`  ✅ ${r.newCampaignName}`);
        lines.push(`     ${r.winners} criativos — recriada após kill`);
      });
      lines.push('');
    }

    // Errors
    if (results.errors.length > 0) {
      lines.push(`❌ *ERROS (${results.errors.length}):*`);
      results.errors.forEach(e => {
        lines.push(`  ${e.name || 'global'}: ${e.error}`);
      });
    }

    lines.push('');
    lines.push(`_${this.dryRun ? '🔸 Modo DRY RUN (simulação)' : '🟢 Modo PRODUÇÃO'}_`);
    lines.push('— Léo Rules Engine 🎯');

    try {
      await this.telegramBot.sendMessage(lines.join('\n'));
    } catch (err) {
      console.error('[RulesEngine] Erro ao enviar relatório Telegram:', err.message);
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  getRules() {
    return { ...RULES };
  }

  getLastAnalysis() {
    try {
      const files = fs.readdirSync(ANALYSES_DIR)
        .filter(f => f.startsWith('analysis-') && f.endsWith('.json'))
        .sort();

      if (files.length === 0) return null;

      const lastFile = files[files.length - 1];
      return JSON.parse(fs.readFileSync(path.join(ANALYSES_DIR, lastFile), 'utf-8'));
    } catch (e) {
      return null;
    }
  }
}

module.exports = RulesEngine;
