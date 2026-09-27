import { prisma } from './prisma'
import { generatedField } from './i18n/generated-content'
import { describeNotificationText, type NotificationContent } from './i18n/notification-messages'

type Notice = { title: string; message: string; content?: unknown; relatedId?: string | null; relatedType?: string | null }
const workTypes = new Set(['WORK_ORDER', 'ChecklistItem'])
const certificateTypes = new Set(['CERTIFICATE', 'Certificate'])
/** Only call after recipient scoping. Two bounded reads resolve proven generated
 * parameters; arbitrary customer text and unmatched historical records stay intact. */
export async function enrichNotificationContent<T extends Notice>(notices: T[]): Promise<T[]> {
  const ids = (types: Set<string>) => notices.filter(n => n.relatedId && types.has(n.relatedType ?? '')).map(n => n.relatedId!)
  const workIds = ids(workTypes), certificateIds = ids(certificateTypes)
  const [work, certificates] = await Promise.all([
    workIds.length ? prisma.checklistItem.findMany({ where: { id: { in: workIds } }, select: { id: true, description: true, generatedContent: true } }) : [],
    certificateIds.length ? prisma.certificate.findMany({ where: { id: { in: certificateIds } }, select: { id: true, title: true, generatedContent: true } }) : [],
  ])
  return notices.map(notice => {
    const field = workTypes.has(notice.relatedType ?? '') ? 'description' : 'title'
    const record = (field === 'description' ? work : certificates).find(row => row.id === notice.relatedId)
    if (!record?.generatedContent) return notice
    const title = describeNotificationText(notice.title), message = describeNotificationText(notice.message)
    if (!title || !message) return notice
    const original = field === 'description' && 'description' in record ? record.description : 'title' in record ? record.title : ''
    const en = generatedField(record, field, 'en'), ar = generatedField(record, field, 'ar')
    if (en === ar) return notice
    const content: NotificationContent = { version: 1, title, message }
    for (const descriptor of [content.title, content.message]) {
      descriptor.localizedArgs = {}
      descriptor.args.forEach((arg, index) => {
        if (arg === original) descriptor.localizedArgs![index] = { en, ar }
      })
    }
    return { ...notice, content }
  })
}
