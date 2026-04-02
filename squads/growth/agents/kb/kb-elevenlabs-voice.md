# ElevenLabs API -- Knowledge Base for AI Voice Narration (PT-BR Ads)

> Pesquisa: Março 2026 | Foco: Narração de anúncios curtos em Português Brasileiro

---

## 1. API Capabilities Overview

### Core Features
- **Text-to-Speech (TTS)**: Converte texto em fala com entonação natural, pacing e consciência emocional
- **Voice Cloning**: Instant (1-2 min de áudio) e Professional (30 min - 3h de áudio)
- **Voice Design**: Cria vozes a partir de descrição textual via prompt
- **Streaming**: WebSocket e HTTP streaming com latência ~75ms (Flash) ou ~500ms (v3)
- **Multilingual**: 74 idiomas (v3) / 29 idiomas (Multilingual v2), incluindo PT-BR
- **Timestamps**: Word-level alignment para legendas sincronizadas (karaoke)
- **Forced Alignment**: Sincronização precisa entre texto e áudio gerado

### Models Disponíveis

| Model ID | Idiomas | Latência | Char Limit/Request | Melhor Para |
|---|---|---|---|---|
| `eleven_v3` | 74 | Alta (~500ms+) | 5.000 chars | Narração expressiva, emoção, diálogos |
| `eleven_multilingual_v2` | 29 | Média | 40.000 chars | Narração padrão, voiceover |
| `eleven_flash_v2_5` | 32+ | Baixa (~75ms) | 40.000 chars | Real-time, chatbots, alto volume |
| `eleven_turbo_v2_5` | 32+ | Baixa | 40.000 chars | Real-time, conversational AI |

**Recomendação para ads**: `eleven_v3` para qualidade máxima (hooks emocionais, storytelling). `eleven_flash_v2_5` para volume alto onde latência importa menos que throughput.

---

## 2. PT-BR Quality & Voices

### Qualidade do Português Brasileiro
- ElevenLabs suporta múltiplos sotaques brasileiros: São Paulo, Rio de Janeiro, Nordeste, interior
- Eleven v3 produz os resultados mais naturais em PT-BR com range emocional amplo
- A biblioteca tem 5.000+ vozes, com opções PT-BR nativas

### Vozes PT-BR Recomendadas para Ads
Buscar na Voice Library (`GET /v1/voices`) filtrando por:
- Idioma: Portuguese (Brazilian)
- Sotaque: São Paulo (mais neutro para ads nacionais)
- Características: "energetic", "confident", "warm"

### Dicas para PT-BR Natural
1. Usar modelo `eleven_v3` para melhor prosódia em PT-BR
2. Escrever o texto exatamente como seria falado (números por extenso, etc.)
3. Pontuação importa: vírgulas controlam pausas, reticências criam suspense
4. Evitar anglicismos sem necessidade -- o modelo pode pronunciar incorretamente
5. Para clones de voz, gravar áudio em PT-BR para melhor resultado

---

## 3. Voice Settings -- Guia Completo

### Parâmetros

```javascript
voice_settings: {
  stability: 0.50,           // 0.0 - 1.0
  similarity_boost: 0.75,    // 0.0 - 1.0
  style: 0.0,                // 0.0 - 1.0
  use_speaker_boost: true    // boolean
}
```

### O que cada parâmetro faz:

**stability** (0.0 - 1.0)
- BAIXO (0.0-0.3): Maior variação emocional, mais expressivo, menos previsível
- MÉDIO (0.4-0.6): Equilíbrio entre expressão e consistência
- ALTO (0.7-1.0): Voz mais monotônica, consistente, previsível
- **Para ads**: 0.30-0.50 (hooks energéticos) | 0.50-0.65 (explicação calma)

**similarity_boost** (0.0 - 1.0)
- Controla fidelidade à voz original
- ALTO: Mais parecido com a voz base, mas pode amplificar artefatos
- BAIXO: Mais "limpo" mas menos fiel
- **Para ads**: 0.75 (padrão bom) | 0.85+ (vozes clonadas, manter identidade)

**style** (0.0 - 1.0)
- Amplifica o estilo/personalidade da voz original
- 0.0: Sem exagero (mais rápido, menor latência)
- 0.5+: Estilo mais pronunciado (mais lento, maior latência)
- **Para ads**: 0.0-0.2 (explicação) | 0.3-0.5 (storytelling) | 0.0 (volume alto)
- **ATENÇÃO**: Valores altos aumentam latência e custo computacional

**use_speaker_boost** (boolean)
- Melhora a fidelidade ao speaker original
- Aumenta latência levemente
- **NÃO disponível para eleven_v3**
- **Para ads**: `true` para vozes clonadas, `false` para vozes da biblioteca

### Presets por Tipo de Ad

```javascript
// HOOK ENERGÉTICO (primeiros 3 segundos)
const hookSettings = {
  stability: 0.30,
  similarity_boost: 0.75,
  style: 0.40,
  use_speaker_boost: true
};

// EXPLICAÇÃO / EDUCACIONAL
const explainSettings = {
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0.15,
  use_speaker_boost: true
};

// STORYTELLING / EMOCIONAL
const storySettings = {
  stability: 0.40,
  similarity_boost: 0.80,
  style: 0.35,
  use_speaker_boost: true
};

// CTA URGENTE (final do vídeo)
const ctaSettings = {
  stability: 0.25,
  similarity_boost: 0.75,
  style: 0.45,
  use_speaker_boost: true
};
```

---

## 4. Voice Styles for Ads -- Controle de Tom via API

### Com eleven_v3: Audio Tags
O modelo v3 suporta **Audio Tags** para controle fino de tom e emoção. Exemplos de como guiar o tom:

```javascript
// Usar pontuação e contexto para guiar emoção
const hookText = "PARE de perder dinheiro! Você sabia que 90% dos sellers da Shopee cometem ESSE erro?";
const calmText = "Deixa eu te explicar, passo a passo, como configurar seus anúncios da forma certa.";
const urgentText = "Mas corre! Essa condição especial acaba HOJE. Clica no link agora!";
```

### Técnicas de Controle de Tom (sem Audio Tags)
1. **CAPS para ênfase**: "PARE de perder dinheiro" -- o modelo interpreta como ênfase
2. **Pontuação para ritmo**: "!" = urgência, "..." = pausa dramática, "?" = tom questionador
3. **Stability baixa + Style alta** = mais emotivo
4. **Stability alta + Style baixa** = mais profissional/neutro
5. **Quebrar texto em segmentos** com settings diferentes por trecho

### Estratégia de Segmentação por Bloco do Ad

```javascript
const adSegments = [
  { text: "Você tá jogando dinheiro fora na Shopee?", settings: hookSettings, pause_after_ms: 300 },
  { text: "A maioria dos sellers configura os anúncios errado e nem sabe.", settings: explainSettings, pause_after_ms: 200 },
  { text: "Eu já ajudei mais de 500 alunos a escalar suas vendas.", settings: storySettings, pause_after_ms: 200 },
  { text: "Clica no link e começa AGORA!", settings: ctaSettings, pause_after_ms: 0 },
];
```

---

## 5. Voice Cloning -- Clonar Sua Própria Voz

### Instant Voice Clone (IVC)
- **Requisitos**: 1-2 minutos de áudio limpo (sem reverb, ruído, música de fundo)
- **Qualidade**: Boa para uso geral, não treina modelo custom
- **Disponível**: Starter+ (planos pagos)
- **Via API**: `POST /v1/voices/add`

### Professional Voice Clone (PVC)
- **Requisitos**: Mínimo 30 minutos, ideal 2-3 horas de áudio limpo
- **Qualidade**: Superior, treina modelo dedicado
- **Disponível**: Creator+ (planos mais altos)
- **Tempo de processamento**: Pode levar horas

### Dicas para Gravação de Áudio para Clone
1. Gravar em ambiente silencioso (sem eco, sem ar condicionado)
2. Usar microfone de boa qualidade (condensador, não headset)
3. Manter distância consistente do microfone (~15-20cm)
4. Falar em tom natural, variando emoções ao longo da gravação
5. Gravar em PT-BR se o uso principal será PT-BR
6. Incluir variações: perguntas, afirmações, exclamações, tom calmo e energético
7. Formato: WAV ou MP3 de alta qualidade (44.1kHz, 16bit+)

### Código Node.js -- Instant Voice Clone

```javascript
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Criar clone de voz
const voice = await client.voices.ivc.create({
  name: 'Neto-Voice-Clone',
  files: [fs.createReadStream('./audio/neto-sample.mp3')],
  remove_background_noise: true,
  description: 'Clone da voz do Neto para narração de ads PT-BR'
});

console.log('Voice ID:', voice.voice_id);
// Usar este voice_id em todas as chamadas TTS subsequentes
```

---

## 6. Audio Output -- Formatos e Qualidade

### Formatos Suportados

| Formato | Sample Rate | Bitrate | Planos | Código API |
|---------|-----------|---------|--------|------------|
| MP3 | 44.1kHz | 128kbps | Free+ | `mp3_44100_128` |
| MP3 | 44.1kHz | 192kbps | Creator+ | `mp3_44100_192` |
| MP3 | 22.05kHz | 32kbps | Free+ | `mp3_22050_32` |
| WAV | 44.1kHz | 16bit | Pro+ | `pcm_44100` |
| PCM | 16kHz | 16bit | Free+ | `pcm_16000` |
| PCM | 24kHz | 16bit | Free+ | `pcm_24000` |
| PCM | 44.1kHz | 16bit | Pro+ | `pcm_44100` |
| PCM | 48kHz | 16bit | Pro+ | `pcm_48000` |
| Opus | 48kHz | 128kbps | Free+ | `opus_48000_128` |

### Recomendações para Video Ads

**Para composição de vídeo (ffmpeg/editores)**:
- `mp3_44100_192` -- Melhor custo-benefício, compatível com tudo (Creator+)
- `mp3_44100_128` -- Alternativa OK no plano Free/Starter
- `pcm_44100` -- Máxima qualidade para pós-produção (Pro+)

**Para preview/draft**:
- `mp3_22050_32` -- Arquivo pequeno, geração rápida

**Formato padrão**: `mp3_44100_128` (default da API se não especificado)

---

## 7. Timing & Sync -- Timestamps para Legendas Karaoke

### Endpoint com Timestamps

```
POST /v1/text-to-speech/{voice_id}/with-timestamps
```

### Response Format

```json
{
  "audio_base64": "base64_encoded_mp3_data...",
  "alignment": {
    "characters": ["V", "o", "c", "ê", " ", "t", "á", " ", "p", "e", "r", "d", "e", "n", "d", "o"],
    "character_start_times_seconds": [0.0, 0.05, 0.10, 0.15, 0.20, 0.22, 0.28, 0.33, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70],
    "character_end_times_seconds": [0.05, 0.10, 0.15, 0.20, 0.22, 0.28, 0.33, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75]
  },
  "normalized_alignment": {
    "characters": ["V", "o", "c", "ê", " ", "t", "á", " ", "p", "e", "r", "d", "e", "n", "d", "o"],
    "character_start_times_seconds": [0.0, 0.05, 0.10, 0.15, 0.20, 0.22, 0.28, 0.33, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70],
    "character_end_times_seconds": [0.05, 0.10, 0.15, 0.20, 0.22, 0.28, 0.33, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75]
  }
}
```

### Converter Characters em Words para Legendas

```javascript
/**
 * Converte alignment character-level em word-level timestamps
 * Essencial para legendas estilo karaoke em vídeos curtos
 */
function extractWordTimestamps(alignment) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

  const words = [];
  let currentWord = '';
  let wordStart = null;
  let wordEnd = null;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];

    if (char === ' ' || char === '\n') {
      if (currentWord.length > 0) {
        words.push({
          word: currentWord,
          start: wordStart,
          end: wordEnd,
        });
        currentWord = '';
        wordStart = null;
        wordEnd = null;
      }
    } else {
      if (wordStart === null) {
        wordStart = character_start_times_seconds[i];
      }
      wordEnd = character_end_times_seconds[i];
      currentWord += char;
    }
  }

  // Última palavra
  if (currentWord.length > 0) {
    words.push({ word: currentWord, start: wordStart, end: wordEnd });
  }

  return words;
}

/**
 * Gera SRT a partir dos word timestamps para legendas
 */
function generateSRT(wordTimestamps, wordsPerLine = 4) {
  const lines = [];
  let lineIndex = 1;

  for (let i = 0; i < wordTimestamps.length; i += wordsPerLine) {
    const chunk = wordTimestamps.slice(i, i + wordsPerLine);
    const text = chunk.map(w => w.word).join(' ');
    const start = formatSRTTime(chunk[0].start);
    const end = formatSRTTime(chunk[chunk.length - 1].end);

    lines.push(`${lineIndex}\n${start} --> ${end}\n${text}\n`);
    lineIndex++;
  }

  return lines.join('\n');
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${h}:${m}:${s},${ms}`;
}
```

### Código Completo: TTS com Timestamps

```javascript
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

async function generateNarrationWithTimestamps(text, voiceId, outputPath) {
  const response = await client.textToSpeech.convertWithTimestamps(voiceId, {
    text,
    model_id: 'eleven_v3',
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.40,
      similarity_boost: 0.75,
      style: 0.30,
    },
  });

  // Salvar áudio
  const audioBuffer = Buffer.from(response.audio_base64, 'base64');
  fs.writeFileSync(`${outputPath}.mp3`, audioBuffer);

  // Extrair word timestamps
  const words = extractWordTimestamps(response.alignment);

  // Gerar SRT
  const srt = generateSRT(words, 3); // 3 palavras por linha (bom para shorts)
  fs.writeFileSync(`${outputPath}.srt`, srt);

  // Salvar JSON dos timestamps para uso posterior
  fs.writeFileSync(`${outputPath}_timestamps.json`, JSON.stringify(words, null, 2));

  return { audioPath: `${outputPath}.mp3`, srtPath: `${outputPath}.srt`, words };
}
```

---

## 8. Batch Generation -- Produção em Escala

### Rate Limits por Plano

| Plano | Concurrent Requests | Chars/Mês |
|-------|-------------------|-----------|
| Free | 2 | 10.000 |
| Starter | 3 | 30.000 |
| Creator | 5 | 100.000 |
| Pro | 10 | 500.000 |
| Scale | 15 | 2.000.000 |
| Business | 15 | 11.000.000 |

### Estratégia de Batch com Controle de Concorrência

```javascript
import pLimit from 'p-limit';

/**
 * Gera narração em batch com controle de concorrência
 * @param {Array} scripts - Array de { id, text, voiceId, settings }
 * @param {number} concurrency - Limite de requests simultâneos (respeitar plano)
 */
async function batchGenerateNarrations(scripts, concurrency = 5) {
  const limit = pLimit(concurrency);
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  const results = await Promise.allSettled(
    scripts.map(script =>
      limit(async () => {
        try {
          const response = await client.textToSpeech.convertWithTimestamps(
            script.voiceId,
            {
              text: script.text,
              model_id: 'eleven_v3',
              output_format: 'mp3_44100_128',
              voice_settings: script.settings || {
                stability: 0.45,
                similarity_boost: 0.75,
                style: 0.20,
              },
            }
          );

          const audioBuffer = Buffer.from(response.audio_base64, 'base64');
          const outputPath = `./output/narration_${script.id}`;
          fs.writeFileSync(`${outputPath}.mp3`, audioBuffer);

          const words = extractWordTimestamps(response.alignment);
          fs.writeFileSync(`${outputPath}.srt`, generateSRT(words, 3));

          return { id: script.id, status: 'success', path: `${outputPath}.mp3`, chars: script.text.length };
        } catch (error) {
          if (error.status === 429) {
            // Rate limit -- aguardar e retry
            console.warn(`Rate limit hit for script ${script.id}, waiting 2s...`);
            await new Promise(r => setTimeout(r, 2000));
            // Retry uma vez
            return limit(() => generateSingle(client, script));
          }
          return { id: script.id, status: 'error', error: error.message };
        }
      })
    )
  );

  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length,
    failed: results.filter(r => r.status === 'rejected' || r.value?.status === 'error').length,
    totalChars: results
      .filter(r => r.status === 'fulfilled' && r.value.chars)
      .reduce((sum, r) => sum + r.value.chars, 0),
  };

  console.log('Batch summary:', summary);
  return results;
}
```

### Error Handling

```javascript
// Erros comuns da ElevenLabs API
const ERROR_HANDLERS = {
  401: 'API key inválida ou expirada',
  422: 'Parâmetros inválidos (checar voice_id, model_id, text)',
  429: 'Rate limit -- reduzir concorrência ou aguardar',
  500: 'Erro interno ElevenLabs -- retry com backoff',
};

async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error; // Não retryable
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 9. Pricing -- Análise de Custo para 100-200 Vídeos/Mês

### Estimativa de Consumo

**Premissas**:
- Vídeo curto (30-60s) = ~150-300 chars de narração
- 150 vídeos/mês x 250 chars médio = **37.500 chars/mês**
- 200 vídeos/mês x 300 chars médio = **60.000 chars/mês**
- Incluir iterações/testes: multiplicar por 2x = **75.000 - 120.000 chars/mês**

### Planos ElevenLabs -- Comparação

| Plano | Preço | Chars Incluídos | Custo/Video (est.) | Suficiente? |
|-------|-------|----------------|--------------------|----|
| Starter | $5/mês | 30.000 | N/A | NAO (insuficiente) |
| Creator | $22/mês | 100.000 | ~$0.11-0.15 | TALVEZ (apertado com testes) |
| Pro | $99/mês | 500.000 | ~$0.50-0.66 | SIM (com folga) |
| Scale | $330/mês | 2.000.000 | ~$1.65-2.20 | DEMAIS (overkill) |

**Recomendação**: Plano **Creator ($22/mês)** para começar. Migrar para **Pro ($99/mês)** quando volume passar de 120 vídeos/mês ou precisar de WAV 44.1kHz.

### Overage (excedente)
- Creator: $0.30/1.000 chars excedentes
- Pro: $0.24/1.000 chars excedentes

### Comparação com Alternativas

| Serviço | Custo ~150 vídeos/mês | Qualidade PT-BR | Timestamps |
|---------|----------------------|----------------|------------|
| ElevenLabs (Creator) | ~$22/mês | Excelente | Sim (word-level) |
| ElevenLabs (Pro) | ~$99/mês | Excelente | Sim (word-level) |
| OpenAI gpt-4o-mini-tts | ~$0.90/mês* | Boa (otimizado EN) | Nao nativo |
| OpenAI tts-1-hd | ~$1.13/mês* | Boa (otimizado EN) | Nao nativo |
| Google Cloud TTS | ~$1.50-4/mês* | Boa (WaveNet) | Sim (SSML) |
| Azure Speech | ~$1-4/mês* | Boa (neural) | Sim (SSML) |

*Preços baseados em ~37.500 chars/mês. OpenAI e Google são dramaticamente mais baratos, mas com qualidade inferior para PT-BR.

---

## 10. Integration Patterns -- Node.js

### Setup Básico

```javascript
// package.json dependencies
// "@elevenlabs/elevenlabs-js": "^2.x"
// "p-limit": "^5.x"
// "dotenv": "^16.x"

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import dotenv from 'dotenv';
dotenv.config();

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});
```

### TTS Simples (sem streaming)

```javascript
async function generateNarration(text, voiceId) {
  const audio = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_v3',
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.20,
    },
  });

  // audio é um Readable stream
  const chunks = [];
  for await (const chunk of audio) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
```

### TTS com Timestamps (recomendado para ads)

```javascript
async function generateWithTimestamps(text, voiceId, settings = {}) {
  const response = await client.textToSpeech.convertWithTimestamps(voiceId, {
    text,
    model_id: settings.model || 'eleven_v3',
    output_format: settings.format || 'mp3_44100_128',
    voice_settings: {
      stability: settings.stability ?? 0.45,
      similarity_boost: settings.similarityBoost ?? 0.75,
      style: settings.style ?? 0.20,
    },
  });

  return {
    audioBuffer: Buffer.from(response.audio_base64, 'base64'),
    alignment: response.alignment,
    normalizedAlignment: response.normalized_alignment,
    wordTimestamps: extractWordTimestamps(response.alignment),
  };
}
```

### Streaming TTS (para preview em tempo real)

```javascript
async function streamNarration(text, voiceId) {
  const audioStream = await client.textToSpeech.stream(voiceId, {
    text,
    model_id: 'eleven_flash_v2_5', // Flash para streaming rápido
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.50,
      similarity_boost: 0.75,
      style: 0.0,
    },
  });

  return audioStream; // Readable stream para pipe
}
```

### Listar Vozes Disponíveis

```javascript
async function listVoices() {
  const response = await client.voices.getAll();
  return response.voices.map(v => ({
    id: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels,
    previewUrl: v.preview_url,
  }));
}
```

### Voice Design (criar voz por prompt)

```javascript
async function designVoice(description) {
  // Gerar previews
  const previews = await client.textToVoice.design({
    text: 'Olá! Eu sou uma voz gerada por inteligência artificial para narrar seus anúncios.',
    voice_description: description,
    // Ex: "Young Brazilian male, energetic and confident, São Paulo accent,
    //      suitable for advertising narration"
  });

  // Salvar a voz preferida
  const voice = await client.textToVoice.create({
    voice_name: 'Ad-Narrator-Custom',
    voice_description: description,
    generated_voice_id: previews[0].generated_voice_id,
  });

  return voice;
}
```

### REST API Direto (sem SDK)

```javascript
// Alternativa sem SDK, usando fetch nativo
async function ttsWithFetch(text, voiceId) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_v3',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.20,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ElevenLabs API error ${response.status}: ${JSON.stringify(error)}`);
  }

  return response.json(); // { audio_base64, alignment, normalized_alignment }
}
```

---

## 11. Alternativas -- Comparação Rápida

### OpenAI TTS

**Modelos**: `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts`
**Vozes**: 13 built-in (alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar)
**PT-BR**: Suportado mas otimizado para inglês. Sotaque pode soar artificial.
**Preço**: $0.60/1M chars (gpt-4o-mini-tts input) -- extremamente barato
**Diferencial**: `gpt-4o-mini-tts` aceita `instructions` para guiar tom/estilo via texto
**Limitações**: Sem voice cloning, sem word-level timestamps nativos, apenas 13 vozes
**Veredito**: Bom para volume massivo onde custo importa mais que qualidade PT-BR

```javascript
// OpenAI TTS exemplo
import OpenAI from 'openai';
const openai = new OpenAI();

const response = await openai.audio.speech.create({
  model: 'gpt-4o-mini-tts',
  voice: 'coral',
  input: 'Você está perdendo vendas na Shopee?',
  instructions: 'Speak in energetic Brazilian Portuguese with urgency, like an ad narrator.',
  response_format: 'mp3',
  speed: 1.1,
});
```

### Google Cloud TTS

**Modelos**: Standard, WaveNet, Neural2, Chirp 3
**Vozes PT-BR**: 10+ vozes neurais brasileiras dedicadas (pt-BR-Neural2-A, B, C...)
**Qualidade**: WaveNet/Neural2 são bons. Chirp 3 permite voice cloning com 10s de áudio.
**Preço**: $4/1M chars (Neural2), $16/1M chars (WaveNet) -- barato
**Diferencial**: SSML para controle de prosódia, pausas, ênfase. Vozes PT-BR dedicadas.
**Limitações**: Menos expressivo que ElevenLabs, mais "robótico" em emoções
**Veredito**: Boa opção se precisar de vozes PT-BR nativas a custo baixo

### Azure Speech

**Vozes PT-BR**: Francisca (neural, com tom "cheerful"), Antonio, Brenda, Donato e outras
**Qualidade**: Neural voices são boas, suportam estilos emocionais via SSML
**Preço**: $15/1M chars (neural)
**Diferencial**: SSML com estilos emocionais (cheerful, angry, sad), Custom Neural Voice
**Limitações**: Menos natural que ElevenLabs para narração criativa
**Veredito**: Boa para chatbots e IVR, inferior para creative ads

### Ranking Final para Ads em PT-BR

1. **ElevenLabs** -- Melhor qualidade, mais expressivo, timestamps nativos, voice cloning
2. **Google Cloud TTS (Chirp 3)** -- Melhor custo-benefício, vozes PT-BR dedicadas
3. **OpenAI gpt-4o-mini-tts** -- Mais barato, instrução por texto, mas PT-BR limitado
4. **Azure Speech** -- Sólido mas sem diferencial claro para este use case

---

## 12. Tips Práticos para Produção de Ads em Escala

### Workflow Recomendado

1. **Escrever roteiro** segmentado (hook / corpo / CTA)
2. **Gerar narração com timestamps** via `convertWithTimestamps`
3. **Extrair word timestamps** para legendas karaoke
4. **Compor vídeo** com ffmpeg/remotion usando áudio + legendas sincronizadas
5. **Iterar** -- ajustar voice_settings se tom não ficou bom

### Checklist de Qualidade

- [ ] Texto sem erros de português
- [ ] Números escritos por extenso ("mil e quinhentos", não "1500")
- [ ] Pontuação intencional para controlar ritmo
- [ ] Voice settings ajustados para cada segmento do ad
- [ ] Áudio output em 44.1kHz/128kbps+ para qualidade final
- [ ] SRT gerado com 3-4 palavras por linha (legível em mobile)
- [ ] Preview do áudio antes de compor vídeo

### Otimização de Custo

1. **Cache narrations** -- se o mesmo texto for usado em variações de vídeo, reutilizar áudio
2. **Usar eleven_flash_v2_5** para testes/previews, eleven_v3 para versão final
3. **Segmentar por settings** -- gerar blocos com settings diferentes e concatenar
4. **Monitorar chars consumidos** -- `GET /v1/user/subscription` retorna uso atual
5. **Considerar OpenAI TTS** para narração menos expressiva (ex: conteúdo educacional longo)

### Limites Importantes

- eleven_v3: max **5.000 chars** por request
- eleven_multilingual_v2 / flash: max **40.000 chars** por request
- Para textos longos, quebrar em chunks e concatenar áudios
- Concurrent requests devem respeitar limites do plano (5 no Creator, 10 no Pro)

---

## Sources

- [ElevenLabs TTS Documentation](https://elevenlabs.io/docs/overview/capabilities/text-to-speech)
- [ElevenLabs API Reference - Create Speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
- [ElevenLabs API - Speech with Timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)
- [ElevenLabs Voice Settings](https://elevenlabs.io/docs/api-reference/voices/settings/get)
- [ElevenLabs Voice Cloning Overview](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning)
- [ElevenLabs Instant Voice Cloning Guide](https://elevenlabs.io/docs/developers/guides/cookbooks/voices/instant-voice-cloning)
- [ElevenLabs Professional Voice Cloning](https://elevenlabs.io/docs/creative-platform/voices/voice-cloning/professional-voice-cloning)
- [ElevenLabs Models Documentation](https://elevenlabs.io/docs/overview/models)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs Pricing Breakdown 2026](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- [ElevenLabs Audio Formats](https://help.elevenlabs.io/hc/en-us/articles/15754340124305-What-audio-formats-do-you-support)
- [ElevenLabs Rate Limits](https://help.elevenlabs.io/hc/en-us/articles/14312733311761-How-many-Text-to-Speech-requests-can-I-make-and-can-I-increase-it)
- [ElevenLabs Node.js SDK (GitHub)](https://github.com/elevenlabs/elevenlabs-js)
- [ElevenLabs PT-BR Voices](https://elevenlabs.io/text-to-speech/portuguese)
- [ElevenLabs Voice Design](https://elevenlabs.io/docs/api-reference/text-to-voice/design)
- [ElevenLabs Eleven v3 Launch](https://elevenlabs.io/blog/eleven-v3)
- [ElevenLabs Forced Alignment](https://elevenlabs.io/docs/overview/capabilities/forced-alignment)
- [OpenAI TTS Guide](https://developers.openai.com/api/docs/guides/text-to-speech)
- [OpenAI gpt-4o-mini-tts Model](https://platform.openai.com/docs/models/gpt-4o-mini-tts)
- [OpenAI TTS Pricing](https://costgoat.com/pricing/openai-tts)
- [Google Cloud TTS Alternatives (ElevenLabs)](https://elevenlabs.io/blog/google-tts-alternatives-2026)
- [Azure Speech Language Support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- [TTS Comparison 2026 (Speechmatics)](https://www.speechmatics.com/company/articles-and-news/best-tts-apis-in-2025-top-12-text-to-speech-services-for-developers)
- [ElevenLabs vs OpenAI TTS (Cartesia)](https://cartesia.ai/vs/elevenlabs-vs-openai-tts)
- [ElevenLabs Cheat Sheet 2025 (Webfuse)](https://www.webfuse.com/elevenlabs-cheat-sheet)
