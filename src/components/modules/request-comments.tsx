'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  MessageSquare, 
  Send, 
  Pencil, 
  X, 
  Check,
  User,
} from 'lucide-react'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
  createdBy: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

interface RequestCommentsProps {
  branchId: string
  requestId: string
  currentUserId: string
}

export function RequestComments({ branchId, requestId, currentUserId }: RequestCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${requestId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [branchId, requestId])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add comment')
      }

      setNewComment('')
      fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${requestId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: editingId, content: editContent }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update comment')
      }

      setEditingId(null)
      setEditContent('')
      fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getRoleBadge = (role: string) => {
    if (role === 'CONTRACTOR') {
      return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Contractor</Badge>
    }
    if (role === 'CLIENT') {
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Client</Badge>
    }
    if (role === 'TEAM_MEMBER' || role === 'SUPERVISOR') {
      return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Team</Badge>
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">Comments</h4>
        {comments.length > 0 && (
          <Badge variant="secondary" className="text-xs">{comments.length}</Badge>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className={`p-3 rounded-lg border ${
                comment.createdBy.id === currentUserId 
                  ? 'bg-primary/5 border-primary/20 ml-4' 
                  : 'bg-muted/50 mr-4'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.createdBy.name || comment.createdBy.email.split('@')[0]}
                      </span>
                      {getRoleBadge(comment.createdBy.role)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                      {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
                    </span>
                  </div>
                </div>
                {comment.createdBy.id === currentUserId && editingId !== comment.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => startEdit(comment)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {editingId === comment.id ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={saving || !editContent.trim()}
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      <span className="ml-1">Save</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      <X className="h-3 w-3" />
                      <span className="ml-1">Cancel</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm mt-2 whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="text-sm"
        />
        <Button
          onClick={handleSubmitComment}
          disabled={submitting || !newComment.trim()}
          className="self-end"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
