import { enumLabel, enumLabels } from './enum-labels'
import type { Locale } from './translations'

/** Exact historical templates only. Captured customer text is preserved verbatim.
 * Unknown historical messages remain unchanged instead of guessing their meaning.
 */
export const notificationRegistry = {
  notice001: ['طلب خدمة جديد', 'New service request'],
  notice002: ['طلب جديد: {0}', 'New request: {0}'],
  notice003: ['أمر عمل جاهز للمراجعة', 'Work order ready for review'],
  notice004: ['أمر العمل "{0}" جاهز للمراجعة', 'Work order "{0}" is ready for review'],
  notice005: ['بدء أمر العمل', 'Work order started'],
  notice006: ['بدأ العمل على "{0}"', 'Work started on "{0}"'],
  notice007: ['إكمال أمر العمل', 'Work order completed'],
  notice008: ['تم إكمال أمر العمل "{0}"', 'Work order "{0}" was completed'],
  notice009: ['رفض أمر العمل', 'Work order rejected'],
  notice010: ['رفض العميل أمر العمل "{0}"', 'The client rejected work order "{0}"'],
  notice011: ['تعيين أمر عمل جديد', 'New work order assignment'],
  notice012: ['تم تعيينك: "{0}"', 'Assigned to you: "{0}"'],
  notice013: ['تحديد سعر أمر العمل', 'Work order price set'],
  notice014: ['تم تحديد سعر ر.س {0} لـ "{1}"', 'A price of SAR {0} was set for "{1}"'],
  notice015: ['التوقيع مطلوب', 'Signature required'],
  notice016: ['توقيعك مطلوب لـ "{0}"', 'Your signature is required for "{0}"'],
  notice017: ['عرض سعر جديد', 'New quotation'],
  notice018: ['تم إرسال عرض سعر لطلبك "{0}"', 'A quotation was sent for your request "{0}"'],
  notice019: ['قبول عرض السعر', 'Quotation accepted'],
  notice020: ['وافق العميل على عرض السعر لـ "{0}"', 'The client accepted the quotation for "{0}"'],
  notice021: ['رفض عرض السعر', 'Quotation rejected'],
  notice022: ['رفض العميل عرض السعر لـ "{0}": {1}', 'The client rejected the quotation for "{0}": {1}'],
  notice023: ['رفض العميل عرض السعر لـ "{0}"', 'The client rejected the quotation for "{0}"'],
  notice024: ['تم إرسال عرض السعر "{0}" للمراجعة', 'Quotation "{0}" was sent for review'],
  notice025: ['الموافقة على عرض السعر', 'Quotation approved'],
  notice026: ['وافق العميل على عرض السعر "{0}"', 'The client approved quotation "{0}"'],
  notice027: ['رفض العميل عرض السعر "{0}": {1}', 'The client rejected quotation "{0}": {1}'],
  notice028: ['رفض العميل عرض السعر "{0}"', 'The client rejected quotation "{0}"'],
  notice029: ['موعد جديد', 'New appointment'],
  notice030: ['تم تحديد موعد: "{0}"', 'Appointment scheduled: "{0}"'],
  notice031: ['تأكيد الموعد', 'Appointment confirmed'],
  notice032: ['أكد العميل الموعد: "{0}"', 'The client confirmed appointment: "{0}"'],
  notice033: ['إلغاء الموعد', 'Appointment cancelled'],
  notice034: ['ألغى العميل الموعد: "{0}"', 'The client cancelled appointment: "{0}"'],
  notice035: ['طلب إعادة جدولة', 'Reschedule requested'],
  notice036: ['طلب العميل إعادة جدولة الموعد: "{0}"', 'The client requested to reschedule appointment: "{0}"'],
  notice037: ['تغيير موعد', 'Appointment changed'],
  notice038: ['تم تغيير موعد: "{0}"', 'Appointment changed: "{0}"'],
  notice039: ['طلب فرع جديد', 'New branch request'],
  notice040: ['طلب العميل إنشاء فرع جديد: "{0}"', 'The client requested a new branch: "{0}"'],
  notice041: ['الموافقة على طلب الفرع', 'Branch request approved'],
  notice042: ['تمت الموافقة على طلب الفرع "{0}"', 'Branch request "{0}" was approved'],
  notice043: ['رفض طلب الفرع', 'Branch request rejected'],
  notice044: ['تم رفض طلب الفرع "{0}": {1}', 'Branch request "{0}" was rejected: {1}'],
  notice045: ['تم رفض طلب الفرع "{0}"', 'Branch request "{0}" was rejected'],
  notice046: ['توقيع العقد', 'Contract signed'],
  notice047: ['وقع العميل العقد "{0}"', 'The client signed contract "{0}"'],
  notice048: ['اكتمال العقد', 'Contract completed'],
  notice049: ['تم إكمال العقد "{0}"', 'Contract "{0}" was completed'],
  notice050: ['إصدار شهادة', 'Certificate issued'],
  notice051: ['تم إصدار شهادة: "{0}"', 'Certificate issued: "{0}"'],
  notice052: ['تم تقديم إثبات الدفع', 'Payment Proof Submitted'],
  notice053: ['تم التحقق من الدفع', 'Payment Verified'],
  notice054: ['تم تأكيد الدفع', 'Payment Confirmed'],
  notice055: ['اكتمل العقد', 'Contract Completed'],
  notice056: ['تم تقديم إثبات دفع لعدد {0} من أوامر العمل في {1}', 'Payment proof submitted for {0} work orders in {1}'],
  notice057: ['تم تقديم إثبات دفع لأمر عمل واحد في {0}', 'Payment proof submitted for 1 work order in {0}'],
  notice058: ['تم التحقق من دفع عدد {0} من أوامر العمل في {1}', 'Payment verified for {0} work orders in {1}'],
  notice059: ['تم التحقق من دفع أمر عمل واحد في {0}', 'Payment verified for 1 work order in {0}'],
  notice060: ['اكتمل العقد "{0}". تم سداد جميع أوامر العمل.', 'Contract "{0}" has been completed. All work orders are paid.'],
  notice061: ['قدّم العميل إثبات دفع للفاتورة {0}', 'Client submitted payment proof for invoice {0}'],
  notice062: ['تم تأكيد دفعك للفاتورة {0}', 'Your payment for invoice {0} has been confirmed'],
  notice063: ['تعليق جديد على الطلب', 'New Comment on Request'],
  notice064: ['تعليق جديد على "{0}": {1}', 'New comment on "{0}": {1}'],
  notice065: ['🔧 بدأ أمر العمل', '🔧 Work Order Started'],
  notice066: ['🚨 بدأ العمل فورًا', '🚨 Work Started Immediately'],
  notice067: ['بدأ العميل العمل فورًا: "{0}" - قيد التنفيذ الآن', 'Client started work immediately: "{0}" - Now in IN PROGRESS'],
  notice068: ['بدأ تنفيذ {0} من أوامر العمل: "{1}"', '{0} work orders have been started: "{1}"'],
  notice069: ['بدأ أمر العمل: "{0}"', 'Work order started: "{0}"'],
  notice070: ['تمت أرشفة أمر العمل تلقائيًا', 'Work Order Auto-Archived'],
  notice071: ['تمت أرشفة "{0}" تلقائيًا (اكتمل في {1})', '"{0}" was automatically archived (completed in {1})'],
  notice072: ['أمر عمل مستحق اليوم', 'Work Order Due Today'],
  notice073: ['تذكير بأمر العمل', 'Work Order Reminder'],
  notice074: ['أمر عمل يبدأ اليوم', 'Work Order Starting Today'],
  notice075: ['من المقرر بدء "{0}" اليوم', '"{0}" is scheduled to begin today'],
  notice076: ['موعد "{0}" للعميل {1} اليوم', '"{0}" for {1} is scheduled today'],
  notice077: ['موعد "{0}" للعميل {1} غدًا', '"{0}" for {1} is scheduled tomorrow'],
  notice078: ['موعد "{0}" للعميل {1} بعد {2} يوم', '"{0}" for {1} is scheduled in {2} days'],
  notice079: ['العقد ينتهي قريبًا', 'Contract Expiring Soon'],
  notice080: ['العقد ينتهي غدًا', 'Contract Expiring Tomorrow'],
  notice081: ['ينتهي عقدك "{0}" غدًا', 'Your contract "{0}" expires tomorrow'],
  notice082: ['ينتهي العقد "{0}" للعميل {1} غدًا', 'Contract "{0}" for {1} expires tomorrow'],
  notice083: ['ينتهي العقد "{0}" للعميل {1} بعد {2} يوم', 'Contract "{0}" for {1} expires in {2} days'],
  notice084: ['الشهادة تنتهي قريبًا', 'Certificate Expiring Soon'],
  notice085: ['الشهادة تنتهي غدًا', 'Certificate Expiring Tomorrow'],
  notice086: ['تنتهي شهادتك "{0}" غدًا', 'Your certificate "{0}" expires tomorrow'],
  notice087: ['تنتهي الشهادة "{0}" للعميل {1} غدًا', 'Certificate "{0}" for {1} expires tomorrow'],
  notice088: ['تنتهي الشهادة "{0}" للعميل {1} بعد {2} يوم', 'Certificate "{0}" for {1} expires in {2} days'],
  notice089: ['تأخر فحص المعدات', 'Equipment Inspection Overdue'],
  notice090: ['اقترب موعد فحص المعدات', 'Equipment Inspection Due Soon'],
  notice091: ['تأخر موعد فحص المعدة {0} ({1}) في {2}.', 'Equipment {0} ({1}) at {2} is overdue for inspection.'],
  notice092: ['تنتهي صلاحية المعدة {0} ({1}) في {2} بعد {3} يوم.', 'Equipment {0} ({1}) at {2} expires in {3} days.'],
} as const
export const notificationTemplates: ReadonlyArray<readonly [string, string]> = Object.values(notificationRegistry)

function pattern(template: string) {
  return new RegExp('^' + template.split(/\{\d+\}/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([\\s\\S]*?)') + '$')
}
const compiled = Object.entries(notificationRegistry).map(([key, pair]) => ({ key, pair, patterns: pair.map(pattern) }))

export function localizeNotificationText(value: string, locale: Locale): string {
  const target = locale === 'ar' ? 0 : 1
  for (const entry of compiled) {
    for (const source of [0, 1]) {
      const match = entry.patterns[source].exec(value)
      if (match) return entry.pair[target].replace(/\{(\d+)\}/g, (_, index: string) => match[Number(index) + 1] ?? '')
    }
  }
  return value
}

// Stable registry IDs above are persisted. Never renumber or repurpose them.
export type NotificationText = { key: keyof typeof notificationRegistry; args: string[] }
export type NotificationContent = { version: 1; title: NotificationText; message: NotificationText }
export function describeNotificationText(value: string): NotificationText | null {
  for (const entry of compiled) for (const source of [0, 1]) {
    const match = entry.patterns[source].exec(value)
    if (match) return { key: entry.key as NotificationText['key'], args: match.slice(1) }
  }
  return null
}
/** Compatibility boundary for existing writers; persistence carries semantic data.
 * Unregistered system copy must be translated before it can create a new notice.
 */
export function notificationData<T extends { title: string; message: string }>(data: T): T & { content: NotificationContent } {
  const title = describeNotificationText(data.title), message = describeNotificationText(data.message)
  if (!title || !message) throw new Error('Unregistered notification template')
  return { ...data, content: { version: 1, title, message } }
}
export function renderNotificationText(fallback: string, content: unknown, field: 'title' | 'message', locale: Locale): string {
  if (content && typeof content === 'object' && 'version' in content && content.version === 1 && field in content) {
    const descriptor = (content as Record<string, unknown>)[field]
    if (descriptor && typeof descriptor === 'object' && 'key' in descriptor && 'args' in descriptor && typeof descriptor.key === 'string' && Object.hasOwn(notificationRegistry, descriptor.key) && Array.isArray(descriptor.args) && descriptor.args.every(value => typeof value === 'string')) {
      const template = notificationRegistry[descriptor.key as NotificationText['key']][locale === 'ar' ? 0 : 1]
      return template.replace(/\{(\d+)\}/g, (_, index: string) => renderParameter((descriptor.args as string[])[Number(index)] ?? '', descriptor.key as string, Number(index), locale))
    }
  }
  return localizeNotificationText(fallback, locale)
}

function renderParameter(value: string, key: string, index: number, locale: Locale): string {
  // Only the equipment-type slot is an enum; never translate customer parameters.
  const template = notificationRegistry[key as keyof typeof notificationRegistry]?.[1]
  if (index === 1 && template?.startsWith('Equipment {0} ({1})')) {
    const normalized = value.replaceAll(' ', '_').toUpperCase()
    if (Object.hasOwn(enumLabels.en, normalized)) return enumLabel(normalized, locale)
  }
  return value
}
