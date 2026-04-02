import * as fs from 'fs'
import * as path from 'path'

export const dynamic = 'force-dynamic'

const REPO_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), '..')

// Allowed directory prefixes (security)
const ALLOWED_PREFIXES = ['squads/', '.aios-core/', '.claude/commands/']
// Allowed extensions
const ALLOWED_EXTENSIONS = ['.md', '.yaml', '.yml', '.js', '.ts', '.json']
// Root-level cron files allowed
const ALLOWED_ROOT_FILES = ['cron-max-creative-analysis.js', 'cron-rafa.js', 'cron-rafa-audit.js']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return Response.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  // Security: no path traversal
  if (filePath.includes('..') || filePath.includes('\0')) {
    return Response.json({ error: 'Invalid path' }, { status: 400 })
  }

  // Security: must be in allowed prefix OR be an allowed root file
  const isAllowedPrefix = ALLOWED_PREFIXES.some(p => filePath.startsWith(p))
  const isAllowedRootFile = ALLOWED_ROOT_FILES.includes(filePath)
  if (!isAllowedPrefix && !isAllowedRootFile) {
    return Response.json({ error: 'Path not allowed' }, { status: 403 })
  }

  // Security: must have allowed extension
  const ext = path.extname(filePath).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return Response.json({ error: 'File type not allowed' }, { status: 403 })
  }

  const fullPath = path.join(REPO_ROOT, filePath)

  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    const name = path.basename(filePath)
    return Response.json({ name, path: filePath, content })
  } catch {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }
}
