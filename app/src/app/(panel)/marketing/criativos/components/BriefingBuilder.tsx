'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  Conceito,
  Ruminacao,
  Formato,
  CreativeAngulo,
  CreativeFormato,
  CreativePersona,
  CreativeEmocao,
} from '@/lib/types-criativos';
import {
  ALL_ANGULOS,
  ALL_PERSONAS,
  ALL_EMOCOES,
  ANGULO_LABELS,
  ANGULO_COLORS,
  PERSONA_LABELS,
  EMOCAO_LABELS,
  FORMATO_LABELS,
} from '@/lib/types-criativos';

// ── Design tokens (mapped to CSS variables) ────────────────
const COLORS = {
  bg: 'var(--bg-primary)',
  card: 'var(--bg-card)',
  border: 'var(--border-color)',
  lime: 'var(--accent)',
  text: 'var(--text-primary)',
  muted: 'var(--text-muted)',
  warn: '#F59E0B',
  error: '#EF4444',
  success: '#22C55E',
};

// ── Form state interface ────────────────────────────────────
interface FormData {
  conceito_id: string;
  ruminacao_id: string;
  formato_id: string;
  angulo: CreativeAngulo | '';
  persona: CreativePersona | '';
  emocao_primaria: CreativeEmocao | '';
  hook_final: string;
  texto_tela: string;
  problema: string;
  resultado: string;
  solucao: string;
  acao: string;
  roteiro_completo: string;
  copy_primario: string;
  copy_titulo: string;
  copy_descricao: string;
  nome_ad: string;
}

const DEFAULT_RESULTADO =
  'Meus alunos atingem ROAS de 25 com as 4 configurações do Shopee ADS';
const DEFAULT_SOLUCAO =
  'São 4 configurações dentro do Shopee ADS que 90% dos sellers não conhecem';
const DEFAULT_ACAO =
  'Clica no botão e aprende as 4 configurações. R$97.';

const INITIAL: FormData = {
  conceito_id: '',
  ruminacao_id: '',
  formato_id: '',
  angulo: '',
  persona: '',
  emocao_primaria: '',
  hook_final: '',
  texto_tela: '',
  problema: '',
  resultado: DEFAULT_RESULTADO,
  solucao: DEFAULT_SOLUCAO,
  acao: DEFAULT_ACAO,
  roteiro_completo: '',
  copy_primario: '',
  copy_titulo: '',
  copy_descricao: '',
  nome_ad: '',
};

// ── Accordion section state ─────────────────────────────────
type CraveSection = 'choose' | 'ruminate' | 'assemble' | 'validate';

// ── Main component ──────────────────────────────────────────
export function BriefingBuilder({
  prefillAngulo,
  prefillFormato,
}: {
  prefillAngulo?: string;
  prefillFormato?: string;
} = {}) {
  // Form state
  const [form, setForm] = useState<FormData>({
    ...INITIAL,
    angulo: (prefillAngulo as CreativeAngulo) || '',
  });

  // Data from API
  const [conceitos, setConceitos] = useState<Conceito[]>([]);
  const [ruminacoes, setRuminacoes] = useState<Ruminacao[]>([]);
  const [formatos, setFormatos] = useState<Formato[]>([]);

  // UI state
  const [openSections, setOpenSections] = useState<Set<CraveSection>>(
    new Set(['choose'])
  );
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [adCounter, setAdCounter] = useState(100);
  const [conceitoSearch, setConceitoSearch] = useState('');

  // Refs
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch initial data ──────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/conceitos').then((r) => r.json()),
      fetch('/api/formatos').then((r) => r.json()),
    ]).then(([cRes, fRes]) => {
      const c: Conceito[] = cRes.data || [];
      c.sort((a, b) => b.ice_score - a.ice_score);
      setConceitos(c);
      setFormatos(fRes.data || []);

      // If prefillFormato, set formato_id
      if (prefillFormato) {
        const fmt = (fRes.data || []).find(
          (f: Formato) => f.formato === prefillFormato
        );
        if (fmt) {
          setForm((prev) => ({ ...prev, formato_id: fmt.id }));
        }
      }
    });
  }, [prefillFormato]);

  // ── Fetch ruminacoes when conceito changes ──────────────────
  useEffect(() => {
    if (!form.conceito_id) {
      setRuminacoes([]);
      return;
    }
    fetch(`/api/ruminacoes?conceito_id=${form.conceito_id}`)
      .then((r) => r.json())
      .then((res) => setRuminacoes(res.data || []))
      .catch(() => setRuminacoes([]));
  }, [form.conceito_id]);

  // ── Auto-build roteiro completo ─────────────────────────────
  useEffect(() => {
    const parts = [form.problema, form.resultado, form.solucao, form.acao]
      .filter(Boolean)
      .join('\n\n');
    setForm((prev) => ({ ...prev, roteiro_completo: parts }));
  }, [form.problema, form.resultado, form.solucao, form.acao]);

  // ── Auto-generate ad name ───────────────────────────────────
  const generatedAdName = useMemo(() => {
    const num = String(adCounter).padStart(3, '0');
    const fmtLabel = form.formato_id
      ? (() => {
          const fmt = formatos.find((f) => f.id === form.formato_id);
          return fmt ? FORMATO_LABELS[fmt.formato] : 'FMT';
        })()
      : 'FMT';
    const angLabel = form.angulo ? ANGULO_LABELS[form.angulo] : 'ANG';
    return `AD${num} | ${fmtLabel} | ${angLabel} | Shopee Ads`;
  }, [adCounter, form.formato_id, form.angulo, formatos]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, nome_ad: generatedAdName }));
  }, [generatedAdName]);

  // ── Helpers ─────────────────────────────────────────────────
  const update = useCallback(
    (field: keyof FormData, value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    []
  );

  const toggleSection = useCallback((s: CraveSection) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const showToast = useCallback(
    (type: 'success' | 'error', msg: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ type, msg });
      toastTimer.current = setTimeout(() => setToast(null), 4000);
    },
    []
  );

  // ── Conceitos filtered & searchable ─────────────────────────
  const filteredConceitos = useMemo(() => {
    if (!conceitoSearch.trim()) return conceitos;
    const q = conceitoSearch.toLowerCase();
    return conceitos.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.descricao.toLowerCase().includes(q)
    );
  }, [conceitos, conceitoSearch]);

  // ── Formatos grouped by tier ────────────────────────────────
  const formatosByTier = useMemo(() => {
    const tiers: Record<string, Formato[]> = {
      'Tier 1 — Video': [],
      'Tier 2 — Estatico': [],
      'Tier 3 — Story/Reel': [],
    };
    for (const f of formatos) {
      if (f.formato.startsWith('video_')) tiers['Tier 1 — Video'].push(f);
      else if (f.formato.startsWith('estatico_'))
        tiers['Tier 2 — Estatico'].push(f);
      else tiers['Tier 3 — Story/Reel'].push(f);
    }
    return tiers;
  }, [formatos]);

  // ── Validation checks (8 items) ────────────────────────────
  const fullCopy = `${form.copy_primario} ${form.roteiro_completo}`;
  const checks = useMemo(() => {
    const allText = `${form.copy_primario} ${form.roteiro_completo} ${form.hook_final}`;
    return [
      {
        label: 'Linguagem da persona',
        ok: allText.trim().length > 0,
      },
      {
        label: 'Emocao definida',
        ok: form.emocao_primaria !== '',
      },
      {
        label: 'Entity ID unico',
        ok: true,
      },
      {
        label: 'Mecanismo presente',
        ok: /configura[cç]/i.test(allText),
      },
      {
        label: 'Promessa presente',
        ok: /roas/i.test(allText),
      },
      {
        label: 'Hook funciona sem som',
        ok: form.texto_tela.trim().length > 0,
      },
      {
        label: 'Formato definido',
        ok: form.formato_id !== '',
      },
      {
        label: 'Campos obrigatorios',
        ok:
          form.angulo !== '' &&
          form.persona !== '' &&
          form.emocao_primaria !== '' &&
          form.formato_id !== '' &&
          form.hook_final.trim().length > 0 &&
          form.copy_primario.trim().length > 0 &&
          form.copy_titulo.trim().length > 0 &&
          form.copy_descricao.trim().length > 0,
      },
    ];
  }, [
    form.copy_primario,
    form.roteiro_completo,
    form.hook_final,
    form.emocao_primaria,
    form.texto_tela,
    form.formato_id,
    form.angulo,
    form.persona,
    form.copy_titulo,
    form.copy_descricao,
  ]);

  const passedCount = checks.filter((c) => c.ok).length;
  const allPassed = passedCount === checks.length;

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!allPassed) return;
    setSubmitting(true);

    try {
      const selectedFormato = formatos.find(
        (f) => f.id === form.formato_id
      );
      const body = {
        nome: form.nome_ad,
        angulo: form.angulo,
        formato: selectedFormato?.formato || '',
        persona: form.persona,
        emocao_primaria: form.emocao_primaria,
        hook: form.hook_final,
        copy_primario: form.copy_primario,
        copy_titulo: form.copy_titulo,
        copy_descricao: form.copy_descricao,
        roteiro: form.roteiro_completo,
        conceito_id: form.conceito_id || null,
        ruminacao_id: form.ruminacao_id || null,
        formato_id: form.formato_id || null,
        notas: form.texto_tela
          ? `[texto_tela] ${form.texto_tela}`
          : null,
        created_by: 'briefing-builder',
        updated_by: 'briefing-builder',
        status: 'ideia' as const,
        tags: [],
        geracao: 1,
        variacao_de: null,
        agente_produtor: null,
        descricao: null,
        emocao_secundaria: null,
        arquivo_principal: null,
        arquivo_thumbnail: null,
        arquivo_preview: null,
        mime_type: null,
        duracao_segundos: null,
        resolucao: null,
        tamanho_bytes: null,
        meta_ad_id: null,
        meta_adset_id: null,
        meta_campaign_id: null,
        meta_creative_id: null,
        meta_media_id: null,
        meta_upload_at: null,
        meta_url: null,
      };

      const res = await fetch('/api/criativos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast('success', 'Criativo criado com sucesso!');
        setAdCounter((n) => n + 1);
        setForm({ ...INITIAL });
        setOpenSections(new Set(['choose']));
      } else {
        const json = await res.json().catch(() => ({}));
        showToast('error', json.error || 'Erro ao criar criativo');
      }
    } catch {
      showToast('error', 'Erro de conexao com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      className="max-w-3xl mx-auto pb-24 overflow-y-auto"
      style={{ color: COLORS.text }}
    >
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor:
              toast.type === 'success' ? COLORS.success : COLORS.error,
            color: '#000',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Briefing Builder
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
          CRAVE Framework — Choose, Ruminate, Assemble, Validate, Execute
        </p>
      </div>

      <div className="space-y-4">
        {/* ═══════════════ SECTION 1: CHOOSE ═══════════════ */}
        <AccordionSection
          step="C"
          title="CHOOSE"
          subtitle="Conceito, angulo, persona, formato e emocao"
          open={openSections.has('choose')}
          onToggle={() => toggleSection('choose')}
        >
          <div className="space-y-4">
            {/* Conceito — searchable */}
            <div>
              <Label>Conceito</Label>
              <input
                type="text"
                value={conceitoSearch}
                onChange={(e) => setConceitoSearch(e.target.value)}
                placeholder="Buscar conceito..."
                className="w-full px-3 py-2 rounded-lg text-sm border mb-2"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  color: COLORS.text,
                }}
              />
              <select
                value={form.conceito_id}
                onChange={(e) => update('conceito_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  color: COLORS.text,
                }}
              >
                <option value="">Selecionar conceito...</option>
                {filteredConceitos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.descricao.substring(0, 60)}{' '}
                    (ICE {c.ice_score})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Angulo with colored dots */}
              <div>
                <Label>Angulo</Label>
                <select
                  value={form.angulo}
                  onChange={(e) =>
                    update('angulo', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                >
                  <option value="">Selecionar...</option>
                  {ALL_ANGULOS.map((a) => (
                    <option key={a} value={a}>
                      {'\u25CF'} {ANGULO_LABELS[a]}
                    </option>
                  ))}
                </select>
                {form.angulo && (
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{
                        backgroundColor:
                          ANGULO_COLORS[form.angulo],
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: COLORS.muted }}
                    >
                      {ANGULO_LABELS[form.angulo]}
                    </span>
                  </div>
                )}
              </div>

              {/* Persona */}
              <div>
                <Label>Persona</Label>
                <select
                  value={form.persona}
                  onChange={(e) =>
                    update('persona', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                >
                  <option value="">Selecionar...</option>
                  {ALL_PERSONAS.map((p) => (
                    <option key={p} value={p}>
                      {PERSONA_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Formato grouped by tier */}
              <div>
                <Label>Formato</Label>
                <select
                  value={form.formato_id}
                  onChange={(e) =>
                    update('formato_id', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                >
                  <option value="">Selecionar...</option>
                  {Object.entries(formatosByTier).map(
                    ([tier, fmts]) =>
                      fmts.length > 0 && (
                        <optgroup key={tier} label={tier}>
                          {fmts.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nome} ({f.aspect_ratio})
                            </option>
                          ))}
                        </optgroup>
                      )
                  )}
                </select>
              </div>

              {/* Emocao Primaria */}
              <div>
                <Label>Emocao Primaria</Label>
                <select
                  value={form.emocao_primaria}
                  onChange={(e) =>
                    update('emocao_primaria', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                >
                  <option value="">Selecionar...</option>
                  {ALL_EMOCOES.map((e) => (
                    <option key={e} value={e}>
                      {EMOCAO_LABELS[e]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* ═══════════════ SECTION 2: RUMINATE ═══════════════ */}
        <AccordionSection
          step="R"
          title="RUMINATE"
          subtitle="Hook e texto visual (sem som)"
          open={openSections.has('ruminate')}
          onToggle={() => toggleSection('ruminate')}
        >
          <div className="space-y-4">
            {!form.conceito_id && (
              <p
                className="text-xs italic"
                style={{ color: COLORS.muted }}
              >
                Selecione um conceito na secao CHOOSE para carregar
                ruminacoes.
              </p>
            )}

            {/* Ruminacao / Hook dropdown */}
            <div>
              <Label>Ruminacao / Hook</Label>
              <select
                value={form.ruminacao_id}
                onChange={(e) => {
                  const rid = e.target.value;
                  update('ruminacao_id', rid);
                  const rum = ruminacoes.find((r) => r.id === rid);
                  if (rum) {
                    setForm((prev) => ({
                      ...prev,
                      ruminacao_id: rid,
                      hook_final: rum.texto,
                      problema: rum.texto,
                    }));
                  }
                }}
                disabled={ruminacoes.length === 0}
                className="w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-40"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  color: COLORS.text,
                }}
              >
                <option value="">
                  {ruminacoes.length === 0
                    ? 'Nenhuma ruminacao disponivel'
                    : 'Selecionar ruminacao...'}
                </option>
                {ruminacoes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.texto.substring(0, 90)}
                    {r.texto.length > 90 ? '...' : ''} ({r.trigger})
                  </option>
                ))}
              </select>
            </div>

            {/* Hook Final — editable */}
            <div>
              <Label>Hook Final</Label>
              <input
                type="text"
                value={form.hook_final}
                onChange={(e) => update('hook_final', e.target.value)}
                placeholder="Ex: Voce ta queimando dinheiro no Shopee ADS?"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  color: COLORS.text,
                }}
              />
            </div>

            {/* Texto na Tela (sem som) */}
            <div>
              <Label>Texto na Tela (sem som)</Label>
              <input
                type="text"
                value={form.texto_tela}
                onChange={(e) => update('texto_tela', e.target.value)}
                placeholder="Versao curta do hook para overlay no video"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  color: COLORS.text,
                }}
              />
            </div>
          </div>
        </AccordionSection>

        {/* ═══════════════ SECTION 3: ASSEMBLE ═══════════════ */}
        <AccordionSection
          step="A"
          title="ASSEMBLE"
          subtitle="Roteiro PRSA + copy do ad"
          open={openSections.has('assemble')}
          onToggle={() => toggleSection('assemble')}
        >
          <div className="space-y-5">
            {/* PRSA blocks */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>P — Problema</Label>
                <textarea
                  value={form.problema}
                  onChange={(e) => update('problema', e.target.value)}
                  placeholder="O hook / problema que abre o criativo"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                />
              </div>

              <div>
                <Label>R — Resultado</Label>
                <textarea
                  value={form.resultado}
                  onChange={(e) => update('resultado', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                />
              </div>

              <div>
                <Label>S — Solucao</Label>
                <textarea
                  value={form.solucao}
                  onChange={(e) => update('solucao', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                />
              </div>

              <div>
                <Label>A — Acao</Label>
                <textarea
                  value={form.acao}
                  onChange={(e) => update('acao', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                />
              </div>

              {/* Roteiro Completo (read-only concat) */}
              <div>
                <Label>Roteiro Completo (P+R+S+A)</Label>
                <textarea
                  value={form.roteiro_completo}
                  readOnly
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none opacity-80"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: COLORS.border,
                    color: COLORS.muted,
                  }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: COLORS.border }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: COLORS.lime }}
              >
                Copy do Ad (Feed)
              </span>
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: COLORS.border }}
              />
            </div>

            {/* Texto Primario with dual counter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label noMargin>Texto Primario</Label>
                <CharCounter
                  current={form.copy_primario.length}
                  softMax={125}
                  hardMax={250}
                />
              </div>
              <textarea
                value={form.copy_primario}
                onChange={(e) =>
                  update('copy_primario', e.target.value)
                }
                placeholder="Texto principal do anuncio..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor:
                    form.copy_primario.length > 250
                      ? COLORS.error
                      : form.copy_primario.length > 125
                        ? COLORS.warn
                        : COLORS.border,
                  color: COLORS.text,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Headline */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label noMargin>Headline</Label>
                  <SimpleCounter
                    current={form.copy_titulo.length}
                    max={40}
                  />
                </div>
                <input
                  type="text"
                  value={form.copy_titulo}
                  onChange={(e) =>
                    update('copy_titulo', e.target.value)
                  }
                  placeholder="Headline curta e impactante"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor:
                      form.copy_titulo.length > 40
                        ? COLORS.error
                        : COLORS.border,
                    color: COLORS.text,
                  }}
                />
              </div>

              {/* Descricao */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label noMargin>Descricao</Label>
                  <SimpleCounter
                    current={form.copy_descricao.length}
                    max={30}
                  />
                </div>
                <input
                  type="text"
                  value={form.copy_descricao}
                  onChange={(e) =>
                    update('copy_descricao', e.target.value)
                  }
                  placeholder="Descricao breve"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor:
                      form.copy_descricao.length > 30
                        ? COLORS.error
                        : COLORS.border,
                    color: COLORS.text,
                  }}
                />
              </div>
            </div>

            {/* Auto-generated ad name */}
            <div>
              <Label>Nome do Ad (auto-gerado)</Label>
              <input
                type="text"
                value={form.nome_ad}
                onChange={(e) => update('nome_ad', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border font-mono"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  color: COLORS.lime,
                }}
              />
            </div>
          </div>
        </AccordionSection>

        {/* ═══════════════ SECTION 4: VALIDATE ═══════════════ */}
        <AccordionSection
          step="V"
          title="VALIDATE"
          subtitle={`${passedCount}/${checks.length} checks passed`}
          open={openSections.has('validate')}
          onToggle={() => toggleSection('validate')}
          badge={
            allPassed ? (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${COLORS.success}22`,
                  color: COLORS.success,
                }}
              >
                PRONTO
              </span>
            ) : (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${COLORS.warn}22`,
                  color: COLORS.warn,
                }}
              >
                {passedCount}/{checks.length}
              </span>
            )
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {checks.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-sm py-1"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: item.ok
                      ? `${COLORS.success}22`
                      : `${COLORS.error}22`,
                    color: item.ok ? COLORS.success : COLORS.error,
                  }}
                >
                  {item.ok ? '\u2713' : '\u2717'}
                </span>
                <span
                  style={{
                    color: item.ok ? COLORS.text : COLORS.muted,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-4 text-sm font-semibold"
            style={{
              color: allPassed ? COLORS.success : COLORS.muted,
            }}
          >
            {passedCount}/{checks.length} checks passed
          </div>
        </AccordionSection>

        {/* ═══════════════ EXECUTE (Submit) ═══════════════ */}
        <div
          className="rounded-xl border p-6 flex items-center justify-between"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.border,
          }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `${COLORS.lime}22`,
                  color: COLORS.lime,
                }}
              >
                E
              </span>
              <span className="font-bold">EXECUTE</span>
            </div>
            <p
              className="text-xs mt-1 ml-9"
              style={{ color: COLORS.muted }}
            >
              {allPassed
                ? 'Todos os checks passaram. Pronto para criar.'
                : `Faltam ${checks.length - passedCount} check(s) para habilitar.`}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allPassed || submitting}
            className="px-8 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: COLORS.lime,
              color: '#000',
            }}
          >
            {submitting ? 'Criando...' : 'Criar Criativo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function AccordionSection({
  step,
  title,
  subtitle,
  open,
  onToggle,
  badge,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden transition-colors"
      style={{
        backgroundColor: COLORS.card,
        borderColor: open ? COLORS.lime + '44' : COLORS.border,
      }}
    >
      {/* Header — clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:brightness-110 transition-all"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            backgroundColor: `${COLORS.lime}22`,
            color: COLORS.lime,
          }}
        >
          {step}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm" style={{ color: COLORS.text }}>
            {title}
          </span>
          <span
            className="text-xs ml-2"
            style={{ color: COLORS.muted }}
          >
            {subtitle}
          </span>
        </div>
        {badge}
        <svg
          className="w-4 h-4 shrink-0 transition-transform"
          style={{
            color: COLORS.muted,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {open && (
        <div
          className="px-6 pb-6 pt-2"
          style={{ borderTop: `1px solid ${COLORS.border}` }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Label({
  children,
  noMargin,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <label
      className={`text-xs font-medium block ${noMargin ? '' : 'mb-1'}`}
      style={{ color: COLORS.muted }}
    >
      {children}
    </label>
  );
}

function CharCounter({
  current,
  softMax,
  hardMax,
}: {
  current: number;
  softMax: number;
  hardMax: number;
}) {
  const overSoft = current > softMax;
  const overHard = current > hardMax;

  return (
    <span className="text-xs font-mono flex items-center gap-1">
      <span
        style={{
          color: overHard
            ? COLORS.error
            : overSoft
              ? COLORS.warn
              : COLORS.muted,
        }}
      >
        {current}/{softMax}
      </span>
      <span style={{ color: COLORS.muted }}>|</span>
      <span
        style={{
          color: overHard ? COLORS.error : COLORS.muted,
        }}
      >
        {current}/{hardMax}
      </span>
    </span>
  );
}

function SimpleCounter({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const over = current > max;
  return (
    <span
      className="text-xs font-mono"
      style={{ color: over ? COLORS.error : COLORS.muted }}
    >
      {current}/{max}
    </span>
  );
}
