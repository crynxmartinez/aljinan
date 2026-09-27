import type { Locale } from './translations'

/** Exact historical templates only. Captured customer text is preserved verbatim.
 * Unknown historical messages remain unchanged instead of guessing their meaning.
 */
export const notificationTemplates: ReadonlyArray<readonly [string, string]> = [
  ['طلب خدمة جديد', 'New service request'],
  ['طلب جديد: {0}', 'New request: {0}'],
  ['أمر عمل جاهز للمراجعة', 'Work order ready for review'],
  ['أمر العمل "{0}" جاهز للمراجعة', 'Work order "{0}" is ready for review'],
  ['بدء أمر العمل', 'Work order started'],
  ['بدأ العمل على "{0}"', 'Work started on "{0}"'],
  ['إكمال أمر العمل', 'Work order completed'],
  ['تم إكمال أمر العمل "{0}"', 'Work order "{0}" was completed'],
  ['رفض أمر العمل', 'Work order rejected'],
  ['رفض العميل أمر العمل "{0}"', 'The client rejected work order "{0}"'],
  ['تعيين أمر عمل جديد', 'New work order assignment'],
  ['تم تعيينك: "{0}"', 'Assigned to you: "{0}"'],
  ['تحديد سعر أمر العمل', 'Work order price set'],
  ['تم تحديد سعر ر.س {0} لـ "{1}"', 'A price of SAR {0} was set for "{1}"'],
  ['التوقيع مطلوب', 'Signature required'],
  ['توقيعك مطلوب لـ "{0}"', 'Your signature is required for "{0}"'],
  ['عرض سعر جديد', 'New quotation'],
  ['تم إرسال عرض سعر لطلبك "{0}"', 'A quotation was sent for your request "{0}"'],
  ['قبول عرض السعر', 'Quotation accepted'],
  ['وافق العميل على عرض السعر لـ "{0}"', 'The client accepted the quotation for "{0}"'],
  ['رفض عرض السعر', 'Quotation rejected'],
  ['رفض العميل عرض السعر لـ "{0}": {1}', 'The client rejected the quotation for "{0}": {1}'],
  ['رفض العميل عرض السعر لـ "{0}"', 'The client rejected the quotation for "{0}"'],
  ['تم إرسال عرض السعر "{0}" للمراجعة', 'Quotation "{0}" was sent for review'],
  ['الموافقة على عرض السعر', 'Quotation approved'],
  ['وافق العميل على عرض السعر "{0}"', 'The client approved quotation "{0}"'],
  ['رفض العميل عرض السعر "{0}": {1}', 'The client rejected quotation "{0}": {1}'],
  ['رفض العميل عرض السعر "{0}"', 'The client rejected quotation "{0}"'],
  ['موعد جديد', 'New appointment'],
  ['تم تحديد موعد: "{0}"', 'Appointment scheduled: "{0}"'],
  ['تأكيد الموعد', 'Appointment confirmed'],
  ['أكد العميل الموعد: "{0}"', 'The client confirmed appointment: "{0}"'],
  ['إلغاء الموعد', 'Appointment cancelled'],
  ['ألغى العميل الموعد: "{0}"', 'The client cancelled appointment: "{0}"'],
  ['طلب إعادة جدولة', 'Reschedule requested'],
  ['طلب العميل إعادة جدولة الموعد: "{0}"', 'The client requested to reschedule appointment: "{0}"'],
  ['تغيير موعد', 'Appointment changed'],
  ['تم تغيير موعد: "{0}"', 'Appointment changed: "{0}"'],
  ['طلب فرع جديد', 'New branch request'],
  ['طلب العميل إنشاء فرع جديد: "{0}"', 'The client requested a new branch: "{0}"'],
  ['الموافقة على طلب الفرع', 'Branch request approved'],
  ['تمت الموافقة على طلب الفرع "{0}"', 'Branch request "{0}" was approved'],
  ['رفض طلب الفرع', 'Branch request rejected'],
  ['تم رفض طلب الفرع "{0}": {1}', 'Branch request "{0}" was rejected: {1}'],
  ['تم رفض طلب الفرع "{0}"', 'Branch request "{0}" was rejected'],
  ['توقيع العقد', 'Contract signed'],
  ['وقع العميل العقد "{0}"', 'The client signed contract "{0}"'],
  ['اكتمال العقد', 'Contract completed'],
  ['تم إكمال العقد "{0}"', 'Contract "{0}" was completed'],
  ['إصدار شهادة', 'Certificate issued'],
  ['تم إصدار شهادة: "{0}"', 'Certificate issued: "{0}"'],
  ['تم تقديم إثبات الدفع', 'Payment Proof Submitted'],
  ['تم التحقق من الدفع', 'Payment Verified'],
  ['تم تأكيد الدفع', 'Payment Confirmed'],
  ['اكتمل العقد', 'Contract Completed'],
  ['تم تقديم إثبات دفع لعدد {0} من أوامر العمل في {1}', 'Payment proof submitted for {0} work orders in {1}'],
  ['تم تقديم إثبات دفع لأمر عمل واحد في {0}', 'Payment proof submitted for 1 work order in {0}'],
  ['تم التحقق من دفع عدد {0} من أوامر العمل في {1}', 'Payment verified for {0} work orders in {1}'],
  ['تم التحقق من دفع أمر عمل واحد في {0}', 'Payment verified for 1 work order in {0}'],
  ['اكتمل العقد "{0}". تم سداد جميع أوامر العمل.', 'Contract "{0}" has been completed. All work orders are paid.'],
  ['قدّم العميل إثبات دفع للفاتورة {0}', 'Client submitted payment proof for invoice {0}'],
  ['تم تأكيد دفعك للفاتورة {0}', 'Your payment for invoice {0} has been confirmed'],
  ['تعليق جديد على الطلب', 'New Comment on Request'],
  ['تعليق جديد على "{0}": {1}', 'New comment on "{0}": {1}'],
  ['🔧 بدأ أمر العمل', '🔧 Work Order Started'],
  ['🚨 بدأ العمل فورًا', '🚨 Work Started Immediately'],
  ['بدأ العميل العمل فورًا: "{0}" - قيد التنفيذ الآن', 'Client started work immediately: "{0}" - Now in IN PROGRESS'],
  ['بدأ تنفيذ {0} من أوامر العمل: "{1}"', '{0} work orders have been started: "{1}"'],
  ['بدأ أمر العمل: "{0}"', 'Work order started: "{0}"'],
  ['تمت أرشفة أمر العمل تلقائيًا', 'Work Order Auto-Archived'],
  ['تمت أرشفة "{0}" تلقائيًا (اكتمل في {1})', '"{0}" was automatically archived (completed in {1})'],
  ['أمر عمل مستحق اليوم', 'Work Order Due Today'],
  ['تذكير بأمر العمل', 'Work Order Reminder'],
  ['أمر عمل يبدأ اليوم', 'Work Order Starting Today'],
  ['من المقرر بدء "{0}" اليوم', '"{0}" is scheduled to begin today'],
  ['موعد "{0}" للعميل {1} اليوم', '"{0}" for {1} is scheduled today'],
  ['موعد "{0}" للعميل {1} غدًا', '"{0}" for {1} is scheduled tomorrow'],
  ['موعد "{0}" للعميل {1} بعد {2} يوم', '"{0}" for {1} is scheduled in {2} days'],
  ['العقد ينتهي قريبًا', 'Contract Expiring Soon'],
  ['العقد ينتهي غدًا', 'Contract Expiring Tomorrow'],
  ['ينتهي عقدك "{0}" غدًا', 'Your contract "{0}" expires tomorrow'],
  ['ينتهي العقد "{0}" للعميل {1} غدًا', 'Contract "{0}" for {1} expires tomorrow'],
  ['ينتهي العقد "{0}" للعميل {1} بعد {2} يوم', 'Contract "{0}" for {1} expires in {2} days'],
  ['الشهادة تنتهي قريبًا', 'Certificate Expiring Soon'],
  ['الشهادة تنتهي غدًا', 'Certificate Expiring Tomorrow'],
  ['تنتهي شهادتك "{0}" غدًا', 'Your certificate "{0}" expires tomorrow'],
  ['تنتهي الشهادة "{0}" للعميل {1} غدًا', 'Certificate "{0}" for {1} expires tomorrow'],
  ['تنتهي الشهادة "{0}" للعميل {1} بعد {2} يوم', 'Certificate "{0}" for {1} expires in {2} days'],
  ['تأخر فحص المعدات', 'Equipment Inspection Overdue'],
  ['اقترب موعد فحص المعدات', 'Equipment Inspection Due Soon'],
  ['تأخر موعد فحص المعدة {0} ({1}) في {2}.', 'Equipment {0} ({1}) at {2} is overdue for inspection.'],
  ['تنتهي صلاحية المعدة {0} ({1}) في {2} بعد {3} يوم.', 'Equipment {0} ({1}) at {2} expires in {3} days.'],
]

function pattern(template: string) {
  return new RegExp('^' + template.split(/\{\d+\}/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([\\s\\S]*?)') + '$')
}
const compiled = notificationTemplates.map(pair => ({ pair, patterns: pair.map(pattern) }))

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
