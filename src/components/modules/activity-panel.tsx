'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

interface Activity {
  id: string
  type: 'COMMENT' | 'STATUS_CHANGE' | 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  content: string | null
  createdById: string
  createdByRole: string
  createdByName?: string
  createdAt: string
}

interface ActivityPanelProps {
  branchId: string
  isOpen: boolean
  onClose: () => void
}

const activityIcons: Record<string, React.ReactNode> = {
  COMMENT: <MessageSquare className="h-4 w-4" />,
  STATUS_CHANGE: <RefreshCw className="h-4 w-4" />,
  CREATED: <FileText className="h-4 w-4" />,
  UPDATED: <FileText className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4 text-green-600" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-600" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-emerald-600" />,
}

export function ActivityPanel({ branchId, isOpen, onClose }: ActivityPanelProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.activityPanel
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchActivities = async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const data = await api.get<Activity[]>(`/api/branches/${branchId}/activities`, {
        showToast: false,
      })
      setActivities(data ?? [])
    } catch (err) {
      console.error('Failed to fetch activities:', err)
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchActivities()
    }
  }, [isOpen, branchId])

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setSending(true)
    try {
      await api.post(`/api/branches/${branchId}/activities`, { content: comment })
      // Only clear the box once the comment is actually saved. Clearing it regardless threw
      // away what the user wrote whenever the request failed.
      setComment('')
      fetchActivities()
    } catch (err) {
      console.error('Failed to send comment:', err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return ta.justNow
    if (minutes < 60) return `${minutes}${ta.mAgo}`
    if (hours < 24) return `${hours}${ta.hAgo}`
    if (days < 7) return `${days}${ta.dAgo}`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-background border-s shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">{ta.activity}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Activity List */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {loadFailed ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive/60" />
                <p className="text-sm text-muted-foreground">
                  The activity history could not be loaded.
                </p>
                <button
                  type="button"
                  onClick={fetchActivities}
                  className="mt-3 text-xs underline text-muted-foreground hover:text-foreground"
                >
                  Try again
                </button>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{ta.noActivity}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {activityIcons[activity.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {activity.createdByName || activity.createdByRole}
                        </span>
                        {activity.createdByName && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{activity.createdByRole.toLowerCase()}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatTime(activity.createdAt)}</span>
                      </div>
                      {activity.content && (
                        <p className={`text-sm mt-1 ${activity.type === 'COMMENT' ? '' : 'text-muted-foreground'}`}>
                          {activity.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          <form onSubmit={handleSendComment} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={ta.addComment}
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={sending || !comment.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
