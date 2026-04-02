import * as fs from 'fs'
import * as path from 'path'

export const dynamic = 'force-dynamic'

// ── Repo root (app/ is process.cwd(), repo root is one level up) ──
const REPO_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), '..')

// ── Squad icon/description defaults ──
const SQUAD_META: Record<string, { icon: string; description: string }> = {
  growth: { icon: '🦅', description: 'Growth & Meta Ads performance squad' },
  gestao: { icon: '📊', description: 'Gestão comercial e análise de calls' },
  cs: { icon: '💬', description: 'Customer Success e monitoramento de comunidades' },
  criativoset: { icon: '🎨', description: 'Criativos estáticos para Meta Ads' },
  criativovid: { icon: '🎬', description: 'Criativos em vídeo para Meta Ads' },
  design: { icon: '✨', description: 'Design, branding, fotografia e design systems' },
  AIOS: { icon: '🤖', description: 'Core AIOS agents — orchestration, dev, QA, architecture' },
  LPFactory: { icon: '🏭', description: 'Landing page creation with CRO experts' },
  ZonaGenialidade: { icon: '🧠', description: 'Zona de Genialidade — assessment e blueprint' },
  squadCreator: { icon: '🛠️', description: 'Squad creation and agent management' },
  zapeads: { icon: '📢', description: 'Zape Ads automation' },
  'squad-creator-pro': { icon: '⚙️', description: 'Squad Creator Pro' },
  'squad-design': { icon: '🎭', description: 'Squad Design' },
}

// ── Root-level crons mapped to squads ──
const ROOT_CRONS: Record<string, string> = {
  'cron-max-creative-analysis.js': 'growth',
  'cron-rafa.js': 'gestao',
  'cron-rafa-audit.js': 'gestao',
}

// ── Helpers ──

function safeReaddir(dir: string): string[] {
  try {
    return fs.readdirSync(dir)
  } catch {
    return []
  }
}

function safeReadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function titleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Extract a value from YAML content by nested dot-key.
 * Handles both `agent.name: value` style and nested indented YAML.
 */
function extractYamlValue(yaml: string, ...keys: string[]): string | undefined {
  for (const key of keys) {
    // Try dot-notation key as a flat key first (e.g. "agent.name")
    // Then try nested lookup
    const parts = key.split('.')
    if (parts.length === 1) {
      const re = new RegExp(`^\\s*${escapeRegex(key)}\\s*:\\s*["']?(.+?)["']?\\s*$`, 'm')
      const m = yaml.match(re)
      if (m) return cleanValue(m[1])
    } else {
      // Nested: find the parent block then the child key
      const value = extractNestedYaml(yaml, parts)
      if (value) return value
    }
  }
  return undefined
}

function extractNestedYaml(yaml: string, parts: string[]): string | undefined {
  if (parts.length === 0) return undefined

  // Find the line that declares the first key
  const lines = yaml.split('\n')
  let startIdx = -1
  let parentIndent = -1

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(new RegExp(`^(\\s*)${escapeRegex(parts[0])}\\s*:`))
    if (match) {
      parentIndent = match[1].length
      // Check if value is on same line
      const inlineVal = lines[i].replace(new RegExp(`^\\s*${escapeRegex(parts[0])}\\s*:\\s*`), '').trim()
      if (parts.length === 1 && inlineVal && !inlineVal.startsWith('>') && !inlineVal.startsWith('|')) {
        return cleanValue(inlineVal)
      }
      startIdx = i + 1
      break
    }
  }

  if (startIdx === -1) return undefined

  if (parts.length === 1) {
    // Collect multi-line value
    let value = ''
    for (let i = startIdx; i < lines.length; i++) {
      const lineIndent = lines[i].match(/^(\s*)/)?.[1].length ?? 0
      if (lines[i].trim() === '') { value += '\n'; continue }
      if (lineIndent <= parentIndent) break
      value += lines[i].trim() + ' '
    }
    return cleanValue(value.trim()) || undefined
  }

  // Find child block within parent's scope
  const childLines: string[] = []
  for (let i = startIdx; i < lines.length; i++) {
    const lineIndent = lines[i].match(/^(\s*)/)?.[1].length ?? 0
    if (lines[i].trim() === '') { childLines.push(lines[i]); continue }
    if (lineIndent <= parentIndent) break
    childLines.push(lines[i])
  }

  return extractNestedYaml(childLines.join('\n'), parts.slice(1))
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function cleanValue(v: string): string {
  return v.replace(/^["']|["']$/g, '').replace(/\\U([0-9A-Fa-f]{8})/g, (_m, hex) => {
    return String.fromCodePoint(parseInt(hex, 16))
  }).trim()
}

/**
 * Extract commands array from YAML content.
 */
function extractCommands(yaml: string): Array<{ name: string; description: string }> {
  const commands: Array<{ name: string; description: string }> = []
  const lines = yaml.split('\n')

  // Find "commands:" section
  let inCommands = false
  let commandIndent = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (!inCommands) {
      const match = line.match(/^(\s*)commands\s*:/)
      if (match) {
        inCommands = true
        commandIndent = match[1].length
        continue
      }
    } else {
      const lineIndent = line.match(/^(\s*)/)?.[1].length ?? 0
      if (line.trim() === '') continue
      if (lineIndent <= commandIndent && line.trim() !== '') {
        break // Exited commands block
      }
      // Look for "- name:" or just "- /something" patterns
      const nameMatch = line.match(/^\s*-\s+(?:name:\s*)?["']?([^"'\n]+)["']?/)
      if (nameMatch) {
        const name = nameMatch[1].trim()
        // Try to get description from next line
        let desc = ''
        if (i + 1 < lines.length) {
          const descMatch = lines[i + 1].match(/^\s+description\s*:\s*["']?(.+?)["']?\s*$/)
          if (descMatch) desc = descMatch[1]
        }
        commands.push({ name, description: desc })
      }
    }
  }

  return commands
}

/**
 * Parse an agent .md file to extract metadata.
 */
function parseAgentFile(filePath: string): {
  id: string
  name: string
  title: string
  icon: string
  role: string
  commands: Array<{ name: string; description: string }>
  dependencies: string[]
} {
  const content = safeReadFile(filePath)
  const basename = path.basename(filePath, '.md')

  // Extract YAML — either frontmatter (---) or ```yaml code block
  let yaml = ''
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    yaml = frontmatterMatch[1]
  } else {
    const codeBlockMatch = content.match(/```ya?ml\s*\n([\s\S]*?)```/)
    if (codeBlockMatch) {
      yaml = codeBlockMatch[1]
    }
  }

  const id = extractYamlValue(yaml, 'agent.id', 'id') || basename
  const name = extractYamlValue(yaml, 'agent.name', 'name') || basename
  const title = extractYamlValue(yaml, 'agent.title', 'title') || ''
  const icon = extractYamlValue(yaml, 'agent.icon', 'icon') || ''
  const role = extractYamlValue(yaml, 'persona.role', 'role') || ''
  const commands = extractCommands(yaml)

  // Extract dependencies list
  const dependencies: string[] = []
  const depsMatch = yaml.match(/dependencies\s*:\s*\n((?:\s+-\s+.+\n?)+)/)
  if (depsMatch) {
    const depLines = depsMatch[1].match(/-\s+(.+)/g)
    if (depLines) {
      for (const line of depLines) {
        const m = line.match(/-\s+(.+)/)
        if (m) dependencies.push(m[1].trim())
      }
    }
  }

  return { id, name, title, icon, role, commands, dependencies }
}

/**
 * Get first heading or first non-empty line as description from a markdown file.
 */
function getFileDescription(filePath: string): string {
  const content = safeReadFile(filePath)
  if (!content) return ''

  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('---')) continue // skip frontmatter delimiter
    // Strip markdown heading prefix
    const heading = trimmed.replace(/^#+\s*/, '')
    if (heading) return heading.slice(0, 200)
  }
  return ''
}

/**
 * Collect .md files from a directory as named items.
 */
function collectMdFiles(dir: string): Array<{ name: string; description: string }> {
  const entries = safeReaddir(dir)
  return entries
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({
      name: f,
      description: getFileDescription(path.join(dir, f)),
    }))
}

/**
 * Collect workflow files (.yaml and .md).
 */
function collectWorkflows(dir: string): Array<{ name: string; description: string }> {
  const entries = safeReaddir(dir)
  return entries
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.md'))
    .map((f) => ({
      name: f,
      description: getFileDescription(path.join(dir, f)),
    }))
}

/**
 * Collect cron files recursively.
 */
function collectCrons(dir: string, basePath: string): Array<{ name: string; path: string }> {
  const results: Array<{ name: string; path: string }> = []
  const entries = safeReaddir(dir)

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    try {
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        results.push(...collectCrons(fullPath, path.join(basePath, entry)))
      } else if (entry.startsWith('cron-') && entry.endsWith('.js')) {
        results.push({ name: entry, path: path.join(basePath, entry) })
      }
    } catch {
      // skip
    }
  }

  return results
}

/**
 * Collect knowledge base files from kbs/, kb/, or data/ directories.
 */
function collectKBs(squadDir: string): string[] {
  const kbDirs = ['kbs', 'kb', 'data']
  const files: string[] = []

  for (const dir of kbDirs) {
    const fullDir = path.join(squadDir, dir)
    const entries = safeReaddir(fullDir)
    for (const entry of entries) {
      try {
        const stat = fs.statSync(path.join(fullDir, entry))
        if (stat.isFile()) {
          files.push(`${dir}/${entry}`)
        }
      } catch {
        // skip
      }
    }
  }

  // Also check agents/kbs and agents/kb
  for (const sub of ['agents/kbs', 'agents/kb', 'agents/data']) {
    const fullDir = path.join(squadDir, sub)
    const entries = safeReaddir(fullDir)
    for (const entry of entries) {
      try {
        const stat = fs.statSync(path.join(fullDir, entry))
        if (stat.isFile()) {
          files.push(`${sub}/${entry}`)
        }
      } catch {
        // skip
      }
    }
  }

  return files
}

/**
 * Collect DNA files.
 */
function collectDNA(squadDir: string): string[] {
  const files: string[] = []
  for (const sub of ['dna', 'agents/dna']) {
    const fullDir = path.join(squadDir, sub)
    const entries = safeReaddir(fullDir)
    for (const entry of entries) {
      try {
        const stat = fs.statSync(path.join(fullDir, entry))
        if (stat.isFile()) files.push(`${sub}/${entry}`)
      } catch {
        // skip
      }
    }
  }
  return files
}

interface AgentInfo {
  id: string
  name: string
  title: string
  icon: string
  role: string
  squad: string
  filePath: string
  commands: Array<{ name: string; description: string }>
  dependencies: string[]
  templates: Array<{ name: string; description: string }>
  tasks: Array<{ name: string; description: string }>
  workflows: Array<{ name: string; description: string }>
  checklists: Array<{ name: string; description: string }>
  crons: Array<{ name: string; path: string }>
  kbs: string[]
  dna: string[]
}

interface SquadInfo {
  id: string
  name: string
  icon: string
  description: string
  path: string
  agents: AgentInfo[]
  templates: Array<{ name: string; description: string }>
  tasks: Array<{ name: string; description: string }>
  workflows: Array<{ name: string; description: string }>
  checklists: Array<{ name: string; description: string }>
  crons: Array<{ name: string; path: string }>
}

/**
 * Scan a squad directory and return structured data.
 */
function scanSquad(squadId: string, squadDir: string, relativePath: string): SquadInfo {
  const meta = SQUAD_META[squadId] || { icon: '📁', description: '' }

  // Agents
  const agentsDir = path.join(squadDir, 'agents')
  const agentFiles = safeReaddir(agentsDir).filter(
    (f) => f.endsWith('.md') && !f.startsWith('README')
  )

  const agents: AgentInfo[] = agentFiles.map((f) => {
    const filePath = path.join(agentsDir, f)
    const parsed = parseAgentFile(filePath)
    return {
      ...parsed,
      squad: squadId,
      filePath: path.join(relativePath, 'agents', f),
      templates: [],
      tasks: [],
      workflows: [],
      checklists: [],
      crons: [],
      kbs: [],
      dna: [],
    }
  })

  // Squad-level resources
  const templates = collectMdFiles(path.join(squadDir, 'templates'))
  const tasks = collectMdFiles(path.join(squadDir, 'tasks'))
  const workflows = collectWorkflows(path.join(squadDir, 'workflows'))
  const checklists = collectMdFiles(path.join(squadDir, 'checklists'))
  const crons = collectCrons(squadDir, relativePath)

  return {
    id: squadId,
    name: meta.icon ? `${titleCase(squadId)}` : titleCase(squadId),
    icon: meta.icon,
    description: meta.description,
    path: relativePath.endsWith('/') ? relativePath : relativePath + '/',
    agents,
    templates,
    tasks,
    workflows,
    checklists,
    crons,
  }
}

/**
 * Scan AIOS core agents directory as a virtual squad.
 */
function scanAIOSSquad(): SquadInfo {
  const aiosDir = path.join(REPO_ROOT, '.aios-core', 'development', 'agents')
  const meta = SQUAD_META.AIOS

  const agentFiles = safeReaddir(aiosDir).filter(
    (f) => f.endsWith('.md') && !f.startsWith('README')
  )

  const agents: AgentInfo[] = agentFiles.map((f) => {
    const filePath = path.join(aiosDir, f)
    const parsed = parseAgentFile(filePath)
    return {
      ...parsed,
      squad: 'AIOS',
      filePath: `.aios-core/development/agents/${f}`,
      templates: [],
      tasks: [],
      workflows: [],
      checklists: [],
      crons: [],
      kbs: [],
      dna: [],
    }
  })

  // AIOS tasks and templates live at .aios-core/development/
  const aiosDevDir = path.join(REPO_ROOT, '.aios-core', 'development')
  const templates = collectMdFiles(path.join(aiosDevDir, 'templates'))
  const tasks = collectMdFiles(path.join(aiosDevDir, 'tasks'))
  const workflows = collectWorkflows(path.join(aiosDevDir, 'workflows'))
  const checklists = collectMdFiles(path.join(aiosDevDir, 'checklists'))

  return {
    id: 'AIOS',
    name: 'AIOS',
    icon: meta.icon,
    description: meta.description,
    path: '.aios-core/development/agents/',
    agents,
    templates,
    tasks,
    workflows,
    checklists,
    crons: [],
  }
}

/**
 * Scan .claude/commands/ for squads that only exist there (fallback).
 */
function scanCommandOnlySquads(existingSquadIds: Set<string>): SquadInfo[] {
  const commandsDir = path.join(REPO_ROOT, '.claude', 'commands')
  const entries = safeReaddir(commandsDir)
  const results: SquadInfo[] = []

  for (const entry of entries) {
    if (entry.endsWith('.md')) continue // skip files, only dirs
    const fullPath = path.join(commandsDir, entry)
    try {
      const stat = fs.statSync(fullPath)
      if (!stat.isDirectory()) continue
    } catch {
      continue
    }

    // Skip if we already have this squad from squads/ dir
    if (existingSquadIds.has(entry) || existingSquadIds.has(entry.toLowerCase())) continue

    const squadId = entry
    const meta = SQUAD_META[squadId] || { icon: '📁', description: '' }

    // Try to find agents in the commands dir structure
    const agentsDir = path.join(fullPath, 'agents')
    const agentFiles = safeReaddir(agentsDir).filter((f) => f.endsWith('.md'))

    const agents: AgentInfo[] = agentFiles.map((f) => {
      const filePath = path.join(agentsDir, f)
      const parsed = parseAgentFile(filePath)
      return {
        ...parsed,
        squad: squadId,
        filePath: `.claude/commands/${squadId}/agents/${f}`,
        templates: [],
        tasks: [],
        workflows: [],
        checklists: [],
        crons: [],
        kbs: [],
        dna: [],
      }
    })

    const templates = collectMdFiles(path.join(fullPath, 'templates'))
    const tasks = collectMdFiles(path.join(fullPath, 'tasks'))
    const workflows = collectWorkflows(path.join(fullPath, 'workflows'))
    const checklists = collectMdFiles(path.join(fullPath, 'checklists'))

    results.push({
      id: squadId,
      name: titleCase(squadId),
      icon: meta.icon,
      description: meta.description,
      path: `.claude/commands/${squadId}/`,
      agents,
      templates,
      tasks,
      workflows,
      checklists,
      crons: [],
    })
  }

  return results
}

/**
 * Assign root-level cron files to their mapped squads.
 */
function assignRootCrons(squads: SquadInfo[]): void {
  for (const [cronFile, squadId] of Object.entries(ROOT_CRONS)) {
    const fullPath = path.join(REPO_ROOT, cronFile)
    if (!fs.existsSync(fullPath)) continue

    const squad = squads.find((s) => s.id === squadId || s.id.toLowerCase() === squadId)
    if (squad) {
      // Avoid duplicates
      if (!squad.crons.some((c) => c.name === cronFile)) {
        squad.crons.push({ name: cronFile, path: cronFile })
      }
    }
  }
}

// ── Main GET handler ──

export async function GET() {
  const squads: SquadInfo[] = []

  // 1. Scan squads/ directory
  const squadsDir = path.join(REPO_ROOT, 'squads')
  const squadEntries = safeReaddir(squadsDir)

  for (const entry of squadEntries) {
    const fullPath = path.join(squadsDir, entry)
    try {
      const stat = fs.statSync(fullPath)
      if (!stat.isDirectory()) continue
    } catch {
      continue
    }
    squads.push(scanSquad(entry, fullPath, `squads/${entry}`))
  }

  // 2. Scan AIOS core agents
  squads.push(scanAIOSSquad())

  // 3. Scan .claude/commands/ for command-only squads
  const existingIds = new Set(squads.map((s) => s.id))
  squads.push(...scanCommandOnlySquads(existingIds))

  // 4. Assign root-level crons
  assignRootCrons(squads)

  // 5. Collect KB and DNA data for each squad that has agents
  for (const squad of squads) {
    // Determine the actual squad directory for KB/DNA scanning
    let squadDir: string | null = null
    if (squad.path.startsWith('squads/')) {
      squadDir = path.join(REPO_ROOT, squad.path.replace(/\/$/, ''))
    } else if (squad.path.startsWith('.claude/commands/')) {
      squadDir = path.join(REPO_ROOT, squad.path.replace(/\/$/, ''))
    }

    if (squadDir) {
      const kbs = collectKBs(squadDir)
      const dna = collectDNA(squadDir)

      // Attach to first agent if any, or keep at squad level via agents
      for (const agent of squad.agents) {
        agent.kbs = kbs
        agent.dna = dna
      }
    }
  }

  // 6. Compute stats
  const stats = {
    squads: squads.length,
    agents: squads.reduce((sum, s) => sum + s.agents.length, 0),
    templates: squads.reduce((sum, s) => sum + s.templates.length, 0),
    tasks: squads.reduce((sum, s) => sum + s.tasks.length, 0),
    workflows: squads.reduce((sum, s) => sum + s.workflows.length, 0),
    checklists: squads.reduce((sum, s) => sum + s.checklists.length, 0),
    crons: squads.reduce((sum, s) => sum + s.crons.length, 0),
  }

  return Response.json({
    generated_at: new Date().toISOString(),
    stats,
    squads,
  })
}
