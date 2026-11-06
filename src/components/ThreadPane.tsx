import type { Channel, Member, Thread, ThreadView } from '../platform'
import MessageRow from './MessageRow'
import VoiceBar from './VoiceBar'

interface ThreadPaneProps {
  channel: Channel
  thread: Thread
  members: Member[]
  view: ThreadView
  onExpand: () => void
  onRestore: () => void
  onClose: () => void
}

export default function ThreadPane({
  channel,
  thread,
  members,
  view,
  onExpand,
  onRestore,
  onClose,
}: ThreadPaneProps) {
  const parent = channel.messages.find((m) => m.id === thread.parentMessageId)
  const parentAuthor = parent ? members.find((m) => m.id === parent.authorId) : undefined
  const voiceMembers = thread.voiceMemberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m))

  return (
    <section className={`panel thread thread--${view}`}>
      <header className="panel-header">
        {view === 'full' ? (
          <button type="button" className="breadcrumb" onClick={onRestore}>
            ‹ #{channel.name} /
          </button>
        ) : null}
        <span>{thread.name}</span>
        <span className="panel-header-spacer" />
        <button type="button" className="btn-outline">
          Following
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
          <MessageRow message={parent} author={parentAuthor} />
        ) : null}
        <div className="replies-label">
          {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
        </div>
        {thread.replies.map((reply) => (
          <MessageRow
            key={reply.id}
            message={reply}
            author={members.find((m) => m.id === reply.authorId)}
          />
        ))}
      </div>

      <footer className="composer">
        <textarea className="composer-field" placeholder="Reply in thread" rows={1} />
        <button type="button" className="send-btn" aria-label="Send reply">
          ↑
        </button>
      </footer>
    </section>
  )
}
