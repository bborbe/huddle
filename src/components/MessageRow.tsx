import { memo, useLayoutEffect, useRef, useState } from 'react'
import type { Member, Message } from '../platform'
import { clockTime } from '../lib/format'
import Avatar from './Avatar'
import MessageBody from './MessageBody'
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
   * Its presence is what turns the hover toolbar on. Provided in the channel
   * list and in the thread pane — a reply is a message like any other.
   */
  onReact?: ((emoji: string) => void) | undefined
  /** opens (or starts) this message's thread — drives the toolbar's reply button */
  onReply?: (() => void) | undefined
  localUserId?: string | undefined
}

function MessageRow({
  message,
  author,
  threadReplies,
  onOpenThread,
  onReact,
  onReply,
  localUserId,
}: MessageRowProps) {
  // Opt-in render counter for the walks (SC27): a voice toggle must not drag
  // the message list through a re-render. Inert unless a walk turns it on.
  if (typeof window !== 'undefined' && (window as unknown as { __probeRenders?: boolean }).__probeRenders) {
    const probe = window as unknown as { __msgRenders?: number }
    probe.__msgRenders = (probe.__msgRenders ?? 0) + 1
  }

  const [hovered, setHovered] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  /**
   * Where the toolbar starts, measured on hover. `null` means "not measured
   * yet" and the stylesheet's default applies.
   *
   * The row shrink-wraps a short message, so `100% + 8px` puts the toolbar just
   * past the text — but a message that wraps to the pane's full width makes
   * `100%` the pane, and `100% + 8px` starts past its edge, clipping the
   * toolbar. So: sit past the text when it fits, otherwise clamp to the pane's
   * right edge. Both cases stay next to the message they belong to.
   */
  const [toolbarLeft, setToolbarLeft] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!hovered) {
      setToolbarLeft(null)
      return
    }
    const row = rowRef.current
    const toolbar = toolbarRef.current
    if (!row || !toolbar) return

    const gap = 8
    const rowRect = row.getBoundingClientRect()
    const toolbarRect = toolbar.getBoundingClientRect()
    const pane = row.closest('.channel, .thread')?.getBoundingClientRect() ?? rowRect

    const pastText = rowRect.width + gap
    const fitsPastText = rowRect.left + pastText + toolbarRect.width <= pane.right - gap

    const next = fitsPastText
      ? pastText
      : Math.max(gap, pane.right - gap - toolbarRect.width - rowRect.left)
    setToolbarLeft(next)
  }, [hovered])

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
        <div className="msg-body-row" ref={rowRef}>
          <div className="msg-body">
            <MessageBody body={message.body} />
          </div>

          {/* Anchored to the message's own text block, not the pane's right edge —
              the pointer should not have to cross the whole column to reach it. */}
          {onReact && hovered ? (
            <div
              className="msg-toolbar"
              role="toolbar"
              aria-label="Message actions"
              ref={toolbarRef}
              style={toolbarLeft === null ? undefined : { left: toolbarLeft }}
            >
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
              {/* No reply action inside a thread: a reply to a reply would be a
                  nested thread, which is a separate product question (SC26). */}
              {onReply ? (
                <>
                  <span className="msg-toolbar-sep" aria-hidden="true" />
                  <button
                    type="button"
                    className="msg-toolbar-btn msg-toolbar-reply"
                    aria-label="Reply in thread"
                    onClick={onReply}
                  >
                    ↩
                  </button>
                </>
              ) : null}
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

/**
 * Memoised on the data it renders, deliberately ignoring function identity:
 * the parent builds its callbacks inline, so a shallow compare would re-render
 * every row on any state change — including a voice-preference toggle, which
 * touches nothing a message row displays. The handlers close over the message's
 * own id, which is stable for the lifetime of the row, so a new closure with the
 * same behaviour changes nothing a reader can see.
 */
export default memo(MessageRow, (prev, next) =>
  prev.message === next.message &&
  prev.author === next.author &&
  prev.threadReplies === next.threadReplies &&
  prev.localUserId === next.localUserId &&
  Boolean(prev.onReact) === Boolean(next.onReact) &&
  Boolean(prev.onReply) === Boolean(next.onReply) &&
  Boolean(prev.onOpenThread) === Boolean(next.onOpenThread),
)
