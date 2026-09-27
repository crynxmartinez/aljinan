'use client'
import { useTranslation } from '@/lib/i18n/use-translation'
export function InvitationLanguage({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation()
  return <label className="flex flex-col gap-2 text-sm">
    {t.system.invitationLanguage}
    <select className="rounded-md border bg-background p-2" value={value} onChange={event => onChange(event.target.value)}>
      <option value="ar">{t.system.arabicLanguage}</option>
      <option value="en">{t.system.englishLanguage}</option>
    </select>
  </label>
}
