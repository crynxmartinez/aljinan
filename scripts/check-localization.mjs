import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const words = /[A-Za-z\u0600-\u06ff]{2}/u
const textAttributes = new Set(['placeholder', 'title', 'alt', 'aria-label', 'message', 'description'])
/** Candidate detector, not a proof of complete localization. User data and code
 * identifiers are excluded. The checked-in exceptions have per-entry review reasons. */
export function scan(source, file = 'fixture.tsx') {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const found = []
  const add = (kind, node, value) => {
    const text = value.replace(/\s+/g, ' ').trim()
    if (words.test(text)) found.push({ kind, text, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 })
  }
  function visibleExpression(node, kind) {
    if (!node) return
    if (ts.isPropertyAccessExpression(node) && !/^t[a-z]{0,2}\./.test(node.getText(ast)) && /^(status|stage|role|workOrderType|equipmentType|inspectionResult|businessType|priority|frequency|riskLevel|teamRole|preferredTimeSlot)$/.test(node.name.text)) add('raw-enum', node, node.getText(ast))
    else if (ts.isIdentifier(node) && /^(status|stage|priority|role|teamRole|workOrderType|equipmentType|preferredTimeSlot)$/.test(node.text)) add('raw-enum', node, node.text)
    else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && /^(replace|replaceAll|toLowerCase|toUpperCase)$/.test(node.expression.name.text)) visibleExpression(node.expression.expression, kind)
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(kind, node, node.text)
    else if (ts.isTemplateExpression(node)) {
      const fixed = node.head.text + node.templateSpans.map(span => span.literal.text).join(' ')
      add(kind, node, fixed)
    } else if (ts.isConditionalExpression(node)) {
      visibleExpression(node.whenTrue, kind); visibleExpression(node.whenFalse, kind)
    } else if (ts.isBinaryExpression(node)) {
      // Literal fallbacks/concatenations, not comparisons against internal state IDs.
      if ([ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.PlusToken].includes(node.operatorToken.kind)) {
        visibleExpression(node.left, kind); visibleExpression(node.right, kind)
      }
    }
  }
  function visit(node) {
    if (ts.isJsxText(node)) add('text', node, node.text)
    if (ts.isJsxAttribute(node) && textAttributes.has(node.name.getText(ast)) && node.initializer && ts.isStringLiteral(node.initializer)) add('attribute', node, node.initializer.text)
    if (ts.isPropertyAssignment(node) && /^(label|placeholder|title)$/.test(node.name.getText(ast)) && ts.isStringLiteral(node.initializer)) add('label', node, node.initializer.text)
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(ast)
      if (/^(toast\.(error|success|warning|info)|showErrorToast|alert|confirm|setError)$/.test(callee)) {
        const arg = node.arguments[0]
        visibleExpression(arg, 'message')
      }
      if (/\.(toLocaleString|toLocaleDateString|toLocaleTimeString)$/.test(callee)) {
        if (!node.arguments.length || ts.isStringLiteral(node.arguments[0])) add('format', node, node.getText(ast))
      }
    }
    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent) && !(ts.isJsxElement(node.parent) && ['style', 'script'].includes(node.parent.openingElement.tagName.getText(ast)))) visibleExpression(node.expression, 'text')
    if (ts.isJsxAttribute(node) && textAttributes.has(node.name.getText(ast)) && node.initializer && ts.isJsxExpression(node.initializer)) visibleExpression(node.initializer.expression, 'attribute')
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
  const baselineFile = 'docs/audits/localization-exceptions.json'
  const current = inventory()
  if (process.argv.includes('--inventory')) {
    console.log(JSON.stringify(current, null, 2))
  } else {
    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
    if (baseline.some(item => !item.reason)) throw new Error('Every localization exception requires a review reason')
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
    } else console.log(`Localization guard passed: ${current.length} reviewed exceptions; no unreviewed candidates. Runtime coverage is checked separately.`)
  }
}
