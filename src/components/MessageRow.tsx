import type { Member, Message } from '../platform'
import { clockTime } from '../lib/format'
import Avatar from './Avatar'
import ToolCallCard from './ToolCallCard'

interface MessageRowProps {
  message: Message
  author: Member | undefined
  /** reply count when this message has an open thread */
  threadReplies?: number | undefined
  onOpenThread?: (() => void) | undefined
}

export default function MessageRow({ message, author, threadReplies, onOpenThread }: MessageRowProps) {
  if (!author) return null

  return (
    <article className="msg">
      <Avatar member={author} />
      <div className="msg-main">
        <div className="msg-meta">
          <span className="msg-name">{author.name}</span>
          {author.kind === 'agent' ? <span className="msg-app">app</span> : null}
          <span className="msg-time">{clockTime(message.sentAt)}</span>
        </div>
        <p className="msg-body">{message.body}</p>
        {message.toolCalls.length > 0 ? (
          <div className="tool-list">
            {message.toolCalls.map((call) => (
              <ToolCallCard key={call.id} call={call} />
            ))}
          </div>
        ) : null}
        {threadReplies !== undefined ? (
          <button type="button" className="thread-card" onClick={onOpenThread}>
            <span className="thread-card-name">Thread</span>
            <span className="thread-card-count">
              {threadReplies} {threadReplies === 1 ? 'reply' : 'replies'}
            </span>
          </button>
        ) : null}
      </div>
    </article>
  )
}
