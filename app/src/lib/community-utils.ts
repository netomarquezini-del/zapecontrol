/**
 * Community Intelligence — Utility functions for community group analysis
 */

const QUESTION_STARTERS = /^(como|alguém|algum|qual|quais|por que|porque|onde|quando|o que|vocês|vcs)/i
const QUESTION_MARK = /\?/

export function isQuestion(content: string): boolean {
  if (!content) return false
  const trimmed = content.trim()
  return QUESTION_MARK.test(trimmed) || QUESTION_STARTERS.test(trimmed)
}

export function classifySentimentKeyword(content: string): 'positive' | 'negative' | 'neutral' {
  const lower = content.toLowerCase()
  const positiveWords = ['consegui', 'obrigado', 'valeu', 'top', 'show', 'funcionou', 'vendendo', 'resultado', 'primeira venda', 'excelente', 'maravilh', 'incrível', 'parabéns', 'perfeito', 'ótimo', 'sensacional', 'arrasou', 'demais']
  const negativeWords = ['erro', 'problema', 'não consigo', 'dúvida', 'difícil', 'complicado', 'caro', 'cancelar', 'travou', 'bug', 'péssimo', 'horrível', 'frustrad', 'decepcion', 'não funciona', 'não entendi']

  const hasPositive = positiveWords.some(w => lower.includes(w))
  const hasNegative = negativeWords.some(w => lower.includes(w))

  if (hasPositive && !hasNegative) return 'positive'
  if (hasNegative && !hasPositive) return 'negative'
  return 'neutral'
}

const PT_STOPWORDS = new Set(['de','a','o','que','e','do','da','em','um','para','é','com','não','uma','os','no','se','na','por','mais','as','dos','como','mas','foi','ao','ele','das','tem','à','seu','sua','ou','ser','quando','muito','há','nos','já','está','eu','também','só','pelo','pela','até','isso','ela','entre','era','depois','sem','mesmo','aos','ter','seus','quem','nas','me','esse','eles','estão','você','tinha','foram','essa','num','nem','suas','meu','às','minha','têm','numa','pelos','elas','havia','seja','qual','será','nós','tenho','lhe','deles','essas','esses','pelas','este','tu','te','vocês','vos','lhes','meus','minhas','teu','tua','nosso','nossa','nossos','nossas','dela','delas','esta','estes','estas','aquele','aquela','aqueles','aquelas','isto','aquilo','estou','estamos','estive','esteve','estava','estávamos','estivera','esteja','estejamos','estejam','estivesse','estivéssemos','estivessem','estiver','estivermos','estiverem','sim','nao','boa','bom','ola','oi','tudo','bem','dia','tarde','noite','gente','aqui','ali','la','pra','pro','vai','vou','faz','fez','ver','ter','ser','dar','deu','tá','né','aí','ah','oh','haha','kkk','kk','rs','hehe','então','ainda','sobre','pode','fazer','tem','vou','meu','minha','isso','essa','esse','vocês','gente','pessoal'])

export function extractTopWords(messages: string[], limit = 30): { word: string; count: number }[] {
  const freq: Record<string, number> = {}
  for (const msg of messages) {
    const words = msg.toLowerCase().replace(/[^\wáàâãéèêíïóôõöúçñ]/g, ' ').split(/\s+/)
    for (const w of words) {
      if (w.length < 3 || PT_STOPWORDS.has(w) || /^\d+$/.test(w)) continue
      freq[w] = (freq[w] || 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}
