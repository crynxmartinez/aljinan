import type { Locale } from './translations'
export const publicErrors = {
  EMAIL_DELIVERY_FAILED: ['Email delivery failed. Please retry sending the verification email.', 'تعذر إرسال البريد الإلكتروني. يرجى إعادة إرسال رسالة التحقق.'],
  TITLE_REQUIRED: ['Title is required', 'العنوان مطلوب'],
  EMAIL_REQUIRED: ['Email is required', 'البريد الإلكتروني مطلوب'],
  INVALID_EMAIL: ['Invalid email address', 'عنوان البريد الإلكتروني غير صالح'],
  NAME_EMAIL_REQUIRED: ['Name and email are required', 'الاسم والبريد الإلكتروني مطلوبان'],
  EMAIL_EXISTS: ['A user with this email already exists', 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل'],
  SIGNATURE_REQUIRED: ['Please sign to accept the quote', 'يرجى التوقيع لقبول عرض السعر'],
  INVALID_CREDENTIALS: ['Invalid email or password', 'البريد الإلكتروني أو كلمة المرور غير صحيحة'],
  CONFLICT: ['The record changed. Refresh and try again.', 'تم تغيير السجل. حدّث الصفحة وحاول مجددًا.'],
  SAVE_FAILED: ['The change could not be saved.', 'تعذر حفظ التغيير.'],
  CONTRACT_UPLOAD_FAILED: ['Failed to upload contract file', 'تعذر رفع ملف العقد'],
  QUOTATION_UPLOAD_FAILED: ['Failed to upload quotation file', 'تعذر رفع ملف عرض السعر'],
  EQUIPMENT_LOAD_FAILED: ['Failed to fetch equipment', 'تعذر تحميل المعدات'],
  EQUIPMENT_CREATE_FAILED: ['Failed to add equipment', 'تعذر إضافة المعدات'],
  EQUIPMENT_UPDATE_FAILED: ['Failed to update equipment', 'تعذر تحديث المعدات'],
  EQUIPMENT_DELETE_FAILED: ['Failed to delete equipment', 'تعذر حذف المعدات'],
} as const
export type PublicErrorCode = keyof typeof publicErrors
export function publicErrorMessage(code: unknown, locale: Locale): string | undefined {
  if (typeof code !== 'string' || !Object.hasOwn(publicErrors, code)) return undefined
  return publicErrors[code as PublicErrorCode][locale === 'en' ? 0 : 1]
}
export function knownLegacyError(value: string, locale: Locale): string | undefined {
  const pair = Object.values(publicErrors).find(pair => pair.some(text => text === value))
  return pair?.[locale === 'en' ? 0 : 1]
}
