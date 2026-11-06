import { useRef, useState } from 'react'
import type { Channel, Member, Thread, ThreadView } from '../platform'
import MessageRow from './MessageRow'
import VoiceBar from './VoiceBar'
import { useAutoGrow } from './useAutoGrow'

interface ThreadPaneProps {
  channel: Channel
  thread: Thread
  members: Member[]
  view: ThreadView
  onExpand: () => void
  onRestore: () => void
  onClose: () => void
  onSendReply: (body: string) => void
  onAskAgentVoice: () => void
  /** reactions on the parent message and on every reply (SC26) */
  onReact: (messageId: string, emoji: string) => void
  localUserId: string
}

export default function ThreadPane({
  channel,
  thread,
  members,
  view,
  onExpand,
  onRestore,
  onClose,
  onSendReply,
  onAskAgentVoice,
  onReact,
  localUserId,
}: ThreadPaneProps) {
  const [draft, setDraft] = useState('')
  const draftRef = useRef<HTMLTextAreaElement>(null)
  useAutoGrow(draftRef, draft)

  const parent = channel.messages.find((m) => m.id === thread.parentMessageId)
  const parentAuthor = parent ? members.find((m) => m.id === parent.authorId) : undefined
  const voiceMembers = thread.voiceMemberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m))

  function send() {
    const body = draft.trim()
    if (body.length === 0) return
    onSendReply(body)
    setDraft('')
  }

  return (
    <section className={`panel thread thread--${view}`}>
      <header className="panel-header">
        {view === 'full' ? (
          <button type="button" className="breadcrumb" onClick={onRestore}>
            ‹ {channel.name} /
          </button>
        ) : null}
        <span>{thread.name}</span>
        <span className="panel-header-spacer" />
        <button type="button" className="btn-outline" onClick={onAskAgentVoice}>
          Ask agent
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={view === 'full' ? onRestore : onExpand}
          aria-label={view === 'full' ? 'Collapse thread' : 'Expand thread'}
        >
          {view === 'full' ? '⤡' : '⤢'}
        </button>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close thread">
          ✕
        </button>
      </header>

      <VoiceBar participants={voiceMembers} label="Voice" />

      <div className="panel-body">
        {parent ? (
          <MessageRow
            message={parent}
            author={parentAuthor}
            onReact={(emoji) => onReact(parent.id, emoji)}
            localUserId={localUserId}
          />
        ) : null}
        <div className="replies-label">
          {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
        </div>
        {thread.replies.map((reply) => (
          <MessageRow
            key={reply.id}
            message={reply}
            author={members.find((m) => m.id === reply.authorId)}
            onReact={(emoji) => onReact(reply.id, emoji)}
            localUserId={localUserId}
          />
        ))}
      </div>

      <footer className="composer">
        <textarea
          ref={draftRef}
          className="composer-field"
          placeholder="Reply in thread"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button type="button" className="send-btn" aria-label="Send reply" onClick={send}>
          ↑
        </button>
      </footer>
    </section>
  )
}
