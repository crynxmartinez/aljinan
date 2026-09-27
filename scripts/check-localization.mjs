import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const words = /[A-Za-z\u0600-\u06ff]{2}/u
const textAttributes = new Set(['placeholder', 'title', 'alt', 'aria-label'])
/** Candidate detector, not a proof of complete localization. User data and code
 * identifiers are excluded. The checked-in backlog is explicit technical debt. */
export function scan(source, file = 'fixture.tsx') {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const found = []
  const add = (kind, node, value) => {
    const text = value.replace(/\s+/g, ' ').trim()
    if (words.test(text)) found.push({ kind, text, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 })
  }
  function visit(node) {
    if (ts.isJsxText(node)) add('text', node, node.text)
    if (ts.isJsxAttribute(node) && textAttributes.has(node.name.getText(ast)) && node.initializer && ts.isStringLiteral(node.initializer)) add('attribute', node, node.initializer.text)
    if (ts.isPropertyAssignment(node) && /^(label|placeholder|title)$/.test(node.name.getText(ast)) && ts.isStringLiteral(node.initializer)) add('label', node, node.initializer.text)
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(ast)
      if (/^(toast\.(error|success|warning|info)|showErrorToast|alert|confirm|setError)$/.test(callee)) {
        const arg = node.arguments[0]
        if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) add('message', node, arg.text)
      }
      if (/\.(toLocaleString|toLocaleDateString|toLocaleTimeString)$/.test(callee)) {
        if (!node.arguments.length || ts.isStringLiteral(node.arguments[0])) add('format', node, node.getText(ast))
      }
    }
    if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression)) add('text', node, node.expression.text)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return found
}

export function inventory(root = 'src') {
  const result = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.tsx?$/.test(full) && !full.includes(`${path.sep}i18n${path.sep}`)) {
        for (const item of scan(fs.readFileSync(full, 'utf8'), full)) result.push({ file: full.replaceAll('\\', '/'), ...item })
      }
    }
  }
  walk(root)
  return result
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const baselineFile = 'docs/audits/localization-backlog.json'
  const current = inventory()
  if (process.argv.includes('--inventory')) {
    console.log(JSON.stringify(current, null, 2))
  } else {
    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
    const key = item => JSON.stringify([item.file, item.kind, item.text])
    const allowed = new Map()
    for (const item of baseline) allowed.set(key(item), (allowed.get(key(item)) ?? 0) + 1)
    const additions = current.filter(item => {
      const remaining = allowed.get(key(item)) ?? 0
      if (remaining) { allowed.set(key(item), remaining - 1); return false }
      return true
    })
    if (additions.length) {
      console.error('New localization candidates require a fix or documented review:', additions)
      process.exitCode = 1
    } else console.log(`No new localization candidates. ${current.length} existing candidates remain in the explicit review backlog; this is not a zero-gap claim.`)
  }
}
