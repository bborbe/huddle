import type { Channel, Member } from '../platform'
import MessageRow from './MessageRow'

interface ChannelPaneProps {
  channel: Channel
  members: Member[]
  onOpenThread: (threadId: string) => void
}

export default function ChannelPane({ channel, members, onOpenThread }: ChannelPaneProps) {
  const voiceMembers = channel.voiceMemberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m))

  return (
    <main className="panel channel">
      <header className="panel-header">
        <span className="chan-hash">#</span>
        <span>{channel.name}</span>
        <span className="muted">{channel.topic}</span>
        <span className="panel-header-spacer" />
        {voiceMembers.length > 0 ? (
          <button type="button" className="btn-outline">
            Join voice
          </button>
        ) : null}
      </header>

      <div className="panel-body">
        {channel.messages.map((message) => {
          const author = members.find((m) => m.id === message.authorId)
          const thread = channel.threads.find((t) => t.parentMessageId === message.id)
          const hasThread = Boolean(thread)

          return (
            <MessageRow
              key={message.id}
              message={message}
              author={author}
              threadReplies={hasThread ? thread?.replies.length : undefined}
              onOpenThread={thread ? () => onOpenThread(thread.id) : undefined}
            />
          )
        })}
      </div>

      <footer className="composer">
        <button type="button" className="icon-btn" aria-label="Attach">
          +
        </button>
        <textarea className="composer-field" placeholder={`Message #${channel.name}`} rows={1} />
        <button type="button" className="send-btn" aria-label="Send">
          ↑
        </button>
      </footer>
    </main>
  )
}
