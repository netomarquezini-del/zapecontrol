/**
 * Campaign State Tracker
 *
 * Rastreia o estado de cada campanha/ad set:
 * - Fase atual (1 = aprendizado dias 1-5, 2 = otimização dia 6+)
 * - Dias rodando
 * - Tipo (teste_criativo, teste_publico, escala)
 * - Vendas acumuladas
 * - ROAS acumulado, rolling 3d, rolling 7d
 * - Histórico de ações tomadas
 *
 * Persiste em squads/growth/data/campaign-state.json
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '..', 'data', 'campaign-state.json');

class CampaignState {
  constructor() {
    this.state = this._load();
  }

  // ============================================================
  // Persistence
  // ============================================================

  _load() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('[CampaignState] Erro ao carregar estado:', e.message);
    }
    return { campaigns: {}, adSets: {}, lastUpdated: null };
  }

  save() {
    this.state.lastUpdated = new Date().toISOString();
    try {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('[CampaignState] Erro ao salvar estado:', e.message);
    }
  }

  // ============================================================
  // Campaign Type Detection (by naming convention)
  // ============================================================

  // IDs das campanhas antigas que não seguem a nomenclatura padrão
  static LEGACY_ESCALA_IDS = [
    '120240946037190531',  // Teste Criativos 05 (na verdade é escala)
    '120240938643360531',  // Teste Criativos 04 (na verdade é escala)
    '120240705227540531',  // Teste 18 (na verdade é escala)
    '120240285413700531',  // Teste 07 (na verdade é escala)
    '120240270569120531'   // Teste 04 (na verdade é escala)
  ];

  detectCampaignType(campaignName, campaignId) {
    // Checar IDs legados primeiro
    if (campaignId && CampaignState.LEGACY_ESCALA_IDS.includes(campaignId)) return 'escala';

    const name = (campaignName || '').toLowerCase();
    // v2: "ShopeeADS | Teste [Nº]" = teste criativo (padrão)
    // v2: "ShopeeADS | Teste Publico" = teste público
    // v2: "ShopeeADS | Escala" = escala
    if (name.includes('teste publico') || name.includes('teste_publico') || name.includes('teste público')) return 'teste_publico';
    if (name.includes('teste criativo') || name.includes('teste_criativo') || name.includes('teste ')) return 'teste_criativo';
    if (name.includes('escala')) return 'escala';
    return 'desconhecido';
  }

  // ============================================================
  // Campaign State Management
  // ============================================================

  getCampaign(campaignId) {
    return this.state.campaigns[campaignId] || null;
  }

  getAdSet(adSetId) {
    return this.state.adSets[adSetId] || null;
  }

  /**
   * Registra ou atualiza uma campanha com dados atuais
   */
  /**
   * Extrai data de criação do nome da campanha (formato DD-MM-YYYY)
   * Ex: "Escala 05 | Público ADVG+ | 11-01-2026" → "2026-01-11"
   */
  _extractDateFromName(name) {
    if (!name) return null;
    const match = name.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      const dateStr = `${year}-${month}-${day}`;
      // Validar que é uma data real
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return dateStr;
    }
    return null;
  }

  updateCampaign(campaignId, data) {
    const existing = this.state.campaigns[campaignId] || {};
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (!existing.firstSeen) {
      // Nova campanha — usar data do nome se disponível (campanhas pré-existentes)
      const nameDate = this._extractDateFromName(data.name);
      const firstSeen = nameDate || today;

      this.state.campaigns[campaignId] = {
        id: campaignId,
        name: data.name,
        type: data.type || this.detectCampaignType(data.name, campaignId),
        firstSeen,
        firstSeenSource: nameDate ? 'campaign_name' : 'first_detection',
        status: data.status || 'ACTIVE',
        currentPhase: 1,
        daysRunning: 0,
        dailyBudget: data.dailyBudget || 0,
        actions: [],
        lastChecked: now
      };
    } else {
      // Atualiza existente
      existing.name = data.name || existing.name;
      existing.status = data.status || existing.status;
      existing.dailyBudget = data.dailyBudget || existing.dailyBudget;
      existing.lastChecked = now;

      // Calcular dias rodando
      const firstDate = new Date(existing.firstSeen);
      const todayDate = new Date(today);
      existing.daysRunning = Math.floor((todayDate - firstDate) / 86400000);

      // Determinar fase (v2 — Andromeda + CBO)
      // Dias 1-5: Aprendizado (intocável para budget)
      // Dia 6+: Otimização ativa (±15% diário)
      if (existing.daysRunning <= 5) {
        existing.currentPhase = 1; // Aprendizado — não mexer
      } else {
        existing.currentPhase = 2; // Otimização ativa
      }
    }

    return this.state.campaigns[campaignId];
  }

  /**
   * Registra ou atualiza um ad set com métricas
   */
  updateAdSet(adSetId, data) {
    const existing = this.state.adSets[adSetId] || {};
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (!existing.firstSeen) {
      this.state.adSets[adSetId] = {
        id: adSetId,
        name: data.name,
        campaignId: data.campaignId,
        campaignType: data.campaignType || 'desconhecido',
        firstSeen: today,
        status: data.status || 'ACTIVE',
        currentPhase: 1,
        daysRunning: 0,
        lastChecked: now
      };
    } else {
      existing.name = data.name || existing.name;
      existing.status = data.status || existing.status;
      existing.lastChecked = now;

      const firstDate = new Date(existing.firstSeen);
      const todayDate = new Date(today);
      existing.daysRunning = Math.floor((todayDate - firstDate) / 86400000);

      // v2: Dias 1-5 aprendizado, dia 6+ otimização
      if (existing.daysRunning <= 5) existing.currentPhase = 1;
      else existing.currentPhase = 2;
    }

    return this.state.adSets[adSetId];
  }

  /**
   * Registra ação tomada em campanha/ad set
   */
  recordAction(entityId, entityType, action) {
    const entity = entityType === 'campaign'
      ? this.state.campaigns[entityId]
      : this.state.adSets[entityId];

    if (entity) {
      if (!entity.actions) entity.actions = [];
      entity.actions.push({
        action: action.type,
        reason: action.reason,
        details: action.details || {},
        timestamp: new Date().toISOString()
      });
      // Keep last 20 actions
      if (entity.actions.length > 20) {
        entity.actions = entity.actions.slice(-20);
      }
    }
  }

  /**
   * Marca campanha/ad set como pausado pela automação
   */
  markPaused(entityId, entityType, reason) {
    const entity = entityType === 'campaign'
      ? this.state.campaigns[entityId]
      : this.state.adSets[entityId];

    if (entity) {
      entity.status = 'PAUSED';
      entity.pausedAt = new Date().toISOString();
      entity.pauseReason = reason;
    }
  }

  /**
   * Lista todas as campanhas ativas por tipo
   */
  getActiveCampaignsByType(type) {
    return Object.values(this.state.campaigns)
      .filter(c => c.type === type && c.status === 'ACTIVE');
  }

  /**
   * Lista ad sets ativos de uma campanha
   */
  getActiveAdSetsForCampaign(campaignId) {
    return Object.values(this.state.adSets)
      .filter(a => a.campaignId === campaignId && a.status === 'ACTIVE');
  }

  /**
   * Retorna resumo do estado atual
   */
  getSummary() {
    const campaigns = Object.values(this.state.campaigns);
    const adSets = Object.values(this.state.adSets);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      byType: {
        teste_criativo: campaigns.filter(c => c.type === 'teste_criativo' && c.status === 'ACTIVE').length,
        teste_publico: campaigns.filter(c => c.type === 'teste_publico' && c.status === 'ACTIVE').length,
        escala: campaigns.filter(c => c.type === 'escala' && c.status === 'ACTIVE').length,
        desconhecido: campaigns.filter(c => c.type === 'desconhecido' && c.status === 'ACTIVE').length
      },
      totalAdSets: adSets.length,
      activeAdSets: adSets.filter(a => a.status === 'ACTIVE').length,
      lastUpdated: this.state.lastUpdated
    };
  }

  /**
   * Limpa campanhas/ad sets que estão pausados há mais de 30 dias
   */
  cleanup() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    for (const [id, c] of Object.entries(this.state.campaigns)) {
      if (c.status === 'PAUSED' && c.pausedAt && c.pausedAt < thirtyDaysAgo) {
        delete this.state.campaigns[id];
      }
    }

    for (const [id, a] of Object.entries(this.state.adSets)) {
      if (a.status === 'PAUSED' && a.pausedAt && a.pausedAt < thirtyDaysAgo) {
        delete this.state.adSets[id];
      }
    }

    this.save();
  }
}

module.exports = CampaignState;
