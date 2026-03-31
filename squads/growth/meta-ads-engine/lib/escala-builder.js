/**
 * Escala Builder — Cria campanhas de escala com criativos winners
 *
 * REGRAS v2 — Template Escala (31/03/2026):
 * - Mínimo 3 winners, máximo 15 por campanha
 * - Campanha CBO, 1+ ad sets (Broad, Interesse, LAL se sobreposição < 30%)
 * - Budget inicial escalável (cresce com performance)
 * - Público principal: Broad ADV+ (25-44)
 * - Duplicar com MESMO Post ID (effective_object_story_id) — prova social preservada
 * - Winner roda no teste E na escala simultaneamente
 * - Mesmo criativo + mesmo público em 2 escalas = NUNCA
 * - Mesmo criativo + público diferente = PODE
 * - Dias 1-5: intocável. Dia 6+: ±15% diário
 * - Nomenclatura: ShopeeADS | Escala | DD-MM-YYYY
 *
 * Persistência:
 * - Winners rastreados em /data/winners-pool.json
 * - Cada winner registra: adSetId, adName, creativeId, postId, purchases, cpa, graduatedAt
 * - Ao criar escala, winners marcados com escala_campaign_id (não reusar no mesmo público)
 */

const fs = require('fs');
const path = require('path');

const WINNERS_FILE = path.join(__dirname, '..', '..', 'data', 'winners-pool.json');

const MIN_WINNERS = 3;
const MAX_WINNERS = 15;
const DEFAULT_INITIAL_BUDGET_CENTS = 50000; // R$500 budget inicial CBO (escalável)

// Meta IDs (mesmos do creative-uploader)
const META_CONFIG = {
  PAGE_ID: '103548099270247',
  INSTAGRAM_USER_ID: '17841403638864415',
  PIXEL_ID: '9457207547700143',
  CUSTOM_EVENT_TYPE: 'PURCHASE',
  OPTIMIZATION_GOAL: 'OFFSITE_CONVERSIONS',
  BILLING_EVENT: 'IMPRESSIONS',
  CTA_TYPE: 'LEARN_MORE',
  LINK_URL: 'https://netomarquezini.com.br/curso-ads/',
  URL_TAGS: 'utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}',
  TARGETING: {
    age_max: 44,
    age_min: 25,
    geo_locations: {
      countries: ['BR'],
      location_types: ['home', 'recent']
    },
    targeting_automation: {
      advantage_audience: 1
    }
  },
  // Placements manuais — excluir Audience Network, Explore, Instream, etc.
  PUBLISHER_PLATFORMS: ['facebook', 'instagram'],
  FACEBOOK_POSITIONS: ['feed', 'story', 'reels'],
  INSTAGRAM_POSITIONS: ['stream', 'story', 'reels'],
  // Schedule: 08h-23h (off na madrugada)
  ADSET_SCHEDULE: [
    { start_minute: 480, end_minute: 1380, days: [0, 1, 2, 3, 4, 5, 6] } // 08:00-23:00
  ]
};

class EscalaBuilder {
  constructor(options = {}) {
    this.apiClient = options.apiClient;
    this.telegramBot = options.telegramBot;
    this.adAccountId = options.adAccountId || process.env.META_AD_ACCOUNT_ID;
    this.pool = this._loadPool();
  }

  // ============================================================
  // Winners Pool — Persistência
  // ============================================================

  _loadPool() {
    try {
      if (fs.existsSync(WINNERS_FILE)) {
        return JSON.parse(fs.readFileSync(WINNERS_FILE, 'utf-8'));
      }
    } catch (e) { /* ignore */ }
    return { winners: [], escalasCreated: [] };
  }

  _savePool() {
    try {
      const dir = path.dirname(WINNERS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(WINNERS_FILE, JSON.stringify(this.pool, null, 2));
    } catch (e) {
      console.error('[EscalaBuilder] Erro ao salvar pool:', e.message);
    }
  }

  // ============================================================
  // Registrar winner graduado
  // ============================================================

  registerWinner(data) {
    // Checar se já existe
    const existing = this.pool.winners.find(w =>
      w.adSetId === data.adSetId || w.creativeId === data.creativeId
    );

    if (existing) {
      console.log(`[EscalaBuilder] Winner ${data.adName} já registrado`);
      return false;
    }

    this.pool.winners.push({
      adSetId: data.adSetId,
      adSetName: data.adSetName,
      adName: data.adName,
      adId: data.adId,
      creativeId: data.creativeId,
      postId: data.postId || null, // effective_object_story_id — prova social
      campaignId: data.campaignId,
      purchases: data.purchases,
      cpa: data.cpa || 0,
      roas: data.roas,
      graduatedAt: new Date().toISOString(),
      usedInEscalas: [] // Públicos onde já foi usado
    });

    this._savePool();
    console.log(`[EscalaBuilder] Winner registrado: ${data.adName} (${data.purchases} vendas, ROAS ${data.roas.toFixed(2)})`);
    return true;
  }

  // ============================================================
  // Checar se pode criar escala
  // ============================================================

  getAvailableWinners(publicoKey = 'broad') {
    return this.pool.winners.filter(w => {
      // Não usar se já está nesse público
      return !w.usedInEscalas.includes(publicoKey);
    });
  }

  canCreateEscala(publicoKey = 'broad') {
    const available = this.getAvailableWinners(publicoKey);
    return {
      canCreate: available.length >= MIN_WINNERS,
      available: available.length,
      minimum: MIN_WINNERS,
      winners: available
    };
  }

  // ============================================================
  // Criar campanha de escala
  // ============================================================

  async createEscalaCampaign(publicoKey = 'broad') {
    const check = this.canCreateEscala(publicoKey);

    if (!check.canCreate) {
      console.log(`[EscalaBuilder] Não tem winners suficientes: ${check.available}/${MIN_WINNERS}`);
      return null;
    }

    // Pegar até MAX_WINNERS, ordenados por ROAS (melhores primeiro)
    const winners = check.winners
      .sort((a, b) => b.roas - a.roas)
      .slice(0, MAX_WINNERS);

    const numCreatives = winners.length;
    const budgetCents = DEFAULT_INITIAL_BUDGET_CENTS; // CBO escalável — começa R$500, cresce com performance
    const now = new Date();
    const today = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;

    const campaignName = `ShopeeADS | Escala | ${today}`;

    console.log(`[EscalaBuilder] Criando escala: ${campaignName} (${numCreatives} criativos, R$${budgetCents / 100}/dia)`);

    try {
      // 1. Criar campanha CBO (budget no nível da campanha)
      const campaign = await this.apiClient._post(`/${this.adAccountId}/campaigns`, {
        name: campaignName,
        objective: 'OUTCOME_SALES',
        status: 'ACTIVE',
        special_ad_categories: '[]',
        daily_budget: budgetCents,
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
      });

      const campaignId = campaign.id;
      console.log(`[EscalaBuilder] Campanha criada: ${campaignId}`);

      // 2. Criar ad set (budget no nível da campanha — CBO)
      const publicoLabel = publicoKey === 'broad' ? 'Broad' : publicoKey;
      const adSetName = `${publicoLabel} ADV+ | 25-44`;
      const adSetParams = {
        campaign_id: campaignId,
        name: adSetName,
        billing_event: META_CONFIG.BILLING_EVENT,
        optimization_goal: META_CONFIG.OPTIMIZATION_GOAL,
        promoted_object: JSON.stringify({
          pixel_id: META_CONFIG.PIXEL_ID,
          custom_event_type: META_CONFIG.CUSTOM_EVENT_TYPE
        }),
        targeting: JSON.stringify({
          ...META_CONFIG.TARGETING,
          publisher_platforms: META_CONFIG.PUBLISHER_PLATFORMS,
          facebook_positions: META_CONFIG.FACEBOOK_POSITIONS,
          instagram_positions: META_CONFIG.INSTAGRAM_POSITIONS
        }),
        status: 'ACTIVE',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        pacing_type: ['day_parting'],
        adset_schedule: JSON.stringify(META_CONFIG.ADSET_SCHEDULE)
      };
      const adSet = await this.apiClient._post(`/${this.adAccountId}/adsets`, adSetParams);

      const adSetId = adSet.id;
      console.log(`[EscalaBuilder] Ad set criado: ${adSetId}`);

      // 3. Criar ads (1 por criativo winner)
      const createdAds = [];
      for (const winner of winners) {
        try {
          const adName = winner.adName || `Winner | ${winner.adSetName}`;
          const ad = await this.apiClient._post(`/${this.adAccountId}/ads`, {
            adset_id: adSetId,
            creative: JSON.stringify({ creative_id: winner.creativeId }),
            name: adName,
            status: 'ACTIVE'
          });

          createdAds.push({
            adId: ad.id,
            adName,
            creativeId: winner.creativeId,
            winnerId: winner.adSetId
          });

          // Marcar winner como usado nesse público
          winner.usedInEscalas.push(publicoKey);

          console.log(`[EscalaBuilder] ✅ Ad criado: ${adName}`);
        } catch (err) {
          console.error(`[EscalaBuilder] ❌ Erro ao criar ad ${winner.adName}: ${err.message}`);
        }
      }

      // 4. Registrar escala criada
      const escalaRecord = {
        campaignId,
        campaignName,
        adSetId,
        adSetName,
        publicoKey,
        budget: budgetCents / 100,
        creatives: createdAds.length,
        winners: winners.map(w => ({
          adName: w.adName,
          creativeId: w.creativeId,
          purchases: w.purchases,
          roas: w.roas
        })),
        createdAt: new Date().toISOString(),
        // REGRA: após criar, NUNCA mexe em criativos/público — SÓ BUDGET
        locked: true
      };

      this.pool.escalasCreated.push(escalaRecord);
      this._savePool();

      // 5. Notificar
      await this._notifyEscalaCreated(escalaRecord);

      return escalaRecord;

    } catch (err) {
      console.error(`[EscalaBuilder] Erro ao criar escala: ${err.message}`);
      await this._notify(`❌ Erro ao criar campanha de escala: ${err.message}`);
      return null;
    }
  }

  // ============================================================
  // Notifications
  // ============================================================

  async _notifyEscalaCreated(escala) {
    const lines = [
      '🚀 CAMPANHA DE ESCALA CRIADA',
      '',
      `Campanha: ${escala.campaignName}`,
      `Budget: R$${escala.budget}/dia (CBO)`,
      `Criativos: ${escala.creatives}`,
      '',
      'Winners incluidos:',
    ];

    escala.winners.forEach(w => {
      lines.push(`  ${w.adName} — ${w.purchases} vendas, ROAS ${w.roas.toFixed(2)}x`);
    });

    lines.push('');
    lines.push('REGRAS: Dias 1-5 intocavel (aprendizado)');
    lines.push('Dia 6+: ±15% diario baseado em CPA 3d');
    lines.push('Winners novos entram com mesmo Post ID');
    lines.push('— Leo, escalando com inteligencia');

    await this._notify(lines.join('\n'));
  }

  async _notifyWinnerProgress(available, minimum) {
    await this._notify(
      `🏅 Winners acumulados: ${available}/${minimum}\n` +
      `Quando juntar ${minimum}, crio a campanha de escala automaticamente`
    );
  }

  async _notify(message) {
    if (this.telegramBot) {
      try {
        await this.telegramBot.sendMessage(message, { parseMode: '' });
      } catch (e) {
        console.error('[EscalaBuilder] Telegram error:', e.message);
      }
    }
  }

  // ============================================================
  // Getters
  // ============================================================

  getPoolSummary() {
    const available = this.getAvailableWinners('broad');
    return {
      totalWinners: this.pool.winners.length,
      availableBroad: available.length,
      escalasCreated: (this.pool.escalasCreated || []).length,
      canCreate: available.length >= MIN_WINNERS
    };
  }
}

module.exports = EscalaBuilder;
