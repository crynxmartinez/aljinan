import { describe, expect, it } from 'vitest'
import { scan } from '../../scripts/check-localization.mjs'
import { localizeError } from '@/lib/i18n/error-text'
import { translations } from '@/lib/i18n/translations'

describe('localization regression detector', () => {
  it('finds visible literals, hidden accessibility names, messages and fixed formats', () => {
    const result = scan(`const x = <button aria-label="Close">Save</button>; toast.error('Failed'); date.toLocaleDateString('en-US')`)
    expect(result.map(item => item.kind)).toEqual(expect.arrayContaining(['attribute', 'text', 'message', 'format']))
  })
  it('detects conditional text, template attributes and unformatted enums', () => {
    const result = scan('const x = <p>{ready ? "Done" : "Waiting"}{order.status}</p>; const y = <img alt={`Request photo ${i}`}/>')
    expect(result.map(item => item.kind)).toEqual(expect.arrayContaining(['text', 'attribute', 'raw-enum']))
  })
  it('detects raw enum variables hidden behind case and underscore formatting', () => {
    const result = scan("const x = <p>{priority}{status.replace('_', ' ')}{member.teamRole.toLowerCase()}</p>")
    expect(result.map(item => item.text)).toEqual(['priority', 'status', 'member.teamRole'])
  })
  it('rejects translated filter labels frozen in initial state', () => {
    expect(scan('const [filters] = useState([{label: tw.status, value: "SCHEDULED"}])').map(item => item.kind)).toContain('translated-state')
    expect(scan('const [filters] = useState([{label: "", value: "SCHEDULED"}])')).toEqual([])
  })
  it('ignores CSS syntax and translated status keys', () => {
    expect(scan('const x = <><style>{`body {color: red}`}</style><p>{t.status}</p></>')).toEqual([])
  })
  it('does not classify user data, dictionary access or internal IDs as wording', () => {
    expect(scan(`const route = '/dashboard'; const x = <input id="client-name" placeholder={t.name}/>; const y = <p>{client.name}</p>`)).toEqual([])
  })
  it('renders stored errors in the current language and does not leak backend details', () => {
    expect(localizeError(translations.en.system.forbidden, 'ar')).toBe(translations.ar.system.forbidden)
    expect(localizeError(translations.ar.system.forbidden, 'en')).toBe(translations.en.system.forbidden)
    expect(localizeError('Prisma connection failed at private.internal', 'ar')).toBe(translations.ar.system.serverError)
  })
})
