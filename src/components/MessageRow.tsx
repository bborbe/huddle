import { useState } from 'react'
import type { Member, Message } from '../platform'
import { clockTime } from '../lib/format'
import Avatar from './Avatar'
import ToolCallCard from './ToolCallCard'

/** The quick-reaction set. Changing it is the whole rollback for SC9. */
export const QUICK_REACTIONS = ['👍', '😊', '🚀'] as const

interface MessageRowProps {
  message: Message
  author: Member | undefined
  /** reply count when this message has an open thread */
  threadReplies?: number | undefined
  /** opens the existing thread — drives the `N replies` line */
  onOpenThread?: (() => void) | undefined
  /**
   * Provided only in the channel list. Its presence is what turns the hover
   * toolbar on; the thread pane renders the same row without one.
   */
  onReact?: ((emoji: string) => void) | undefined
  /** opens (or starts) this message's thread — drives the toolbar's reply button */
  onReply?: (() => void) | undefined
  localUserId?: string | undefined
}

export default function MessageRow({
  message,
  author,
  threadReplies,
  onOpenThread,
  onReact,
  onReply,
  localUserId,
}: MessageRowProps) {
  const [hovered, setHovered] = useState(false)
  if (!author) return null

  const reactionEntries = Object.entries(message.reactions ?? {}).filter(
    ([, memberIds]) => memberIds.length > 0,
  )

  return (
    <article
      className="msg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar member={author} />
      <div className="msg-main">
        <div className="msg-meta">
          <span className="msg-name">{author.name}</span>
          {author.kind === 'agent' ? <span className="msg-app">app</span> : null}
          <span className="msg-time">{clockTime(message.sentAt)}</span>
        </div>
        <div className="msg-body-row">
          <p className="msg-body">{message.body}</p>

          {/* Anchored to the message's own text block, not the pane's right edge —
              the pointer should not have to cross the whole column to reach it. */}
          {onReact && hovered ? (
            <div className="msg-toolbar" role="toolbar" aria-label="Message actions">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="msg-toolbar-btn"
                  aria-label={`React with ${emoji}`}
                  onClick={() => onReact(emoji)}
                >
                  {emoji}
                </button>
              ))}
              <span className="msg-toolbar-sep" aria-hidden="true" />
              <button
                type="button"
                className="msg-toolbar-btn msg-toolbar-reply"
                aria-label="Reply in thread"
                onClick={onReply}
              >
                ↩
              </button>
            </div>
          ) : null}
        </div>

        {message.toolCalls.length > 0 ? (
          <div className="tool-list">
            {message.toolCalls.map((call) => (
              <ToolCallCard key={call.id} call={call} />
            ))}
          </div>
        ) : null}

        {reactionEntries.length > 0 ? (
          <div className="reactions">
            {reactionEntries.map(([emoji, memberIds]) => (
              <button
                key={emoji}
                type="button"
                className={`reaction${localUserId && memberIds.includes(localUserId) ? ' reaction--mine' : ''}`}
                onClick={() => onReact?.(emoji)}
                aria-label={`${emoji} ${memberIds.length}`}
                disabled={!onReact}
              >
                <span className="reaction-emoji">{emoji}</span>
                <span className="reaction-count">{memberIds.length}</span>
              </button>
            ))}
          </div>
        ) : null}

        {threadReplies !== undefined ? (
          <button type="button" className="thread-card thread-replies" onClick={onOpenThread}>
            {threadReplies} {threadReplies === 1 ? 'reply' : 'replies'}
          </button>
        ) : null}
      </div>

      {null}
    </article>
  )
}
