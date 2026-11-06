import { useState } from 'react'
import type { Channel, Member, Message } from '../platform'
import MessageRow from './MessageRow'
import SimulatedReply from './SimulatedReply'

interface ChannelPaneProps {
  channel: Channel
  members: Member[]
  agent: Member | undefined
  inVoice: boolean
  onOpenThread: (threadId: string) => void
  onSendMessage: (body: string) => void
  onToggleVoice: () => void
  onAskAgentVoice: () => void
  onAppendMessage: (message: Message) => void
}

export default function ChannelPane({
  channel,
  members,
  agent,
  inVoice,
  onOpenThread,
  onSendMessage,
  onToggleVoice,
  onAskAgentVoice,
  onAppendMessage,
}: ChannelPaneProps) {
  const [draft, setDraft] = useState('')
  const [runId, setRunId] = useState(0)

  const voiceMembers = channel.voiceMemberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m))

  function send() {
    const body = draft.trim()
    if (body.length === 0) return
    onSendMessage(body)
    setDraft('')
  }

  return (
    <main className="panel channel">
      <header className="panel-header">
        <span className="chan-hash">#</span>
        <span>{channel.name}</span>
        <span className="muted">{channel.topic}</span>
        <span className="panel-header-spacer" />
        <button
          type="button"
          className="btn-outline"
          onClick={() => setRunId((n) => n + 1)}
          disabled={!agent}
        >
          Replay reply
        </button>
        <button type="button" className="btn-outline" onClick={onAskAgentVoice}>
          Ask agent to join
        </button>
        <button
          type="button"
          className={`btn-outline${inVoice ? ' btn-outline--danger' : ''}`}
          onClick={onToggleVoice}
        >
          {inVoice ? 'Leave voice' : 'Join voice'}
        </button>
      </header>

      {voiceMembers.length > 0 ? (
        <div className="voice-strip">
          <span className="live-dot" aria-hidden="true" />
          <span className="voice-label">In voice</span>
          <span className="voice-names">{voiceMembers.map((m) => m.name).join(', ')}</span>
        </div>
      ) : null}

      <div className="panel-body">
        {channel.messages.map((message) => {
          const author = members.find((m) => m.id === message.authorId)
          const thread = channel.threads.find((t) => t.parentMessageId === message.id)

          return (
            <MessageRow
              key={message.id}
              message={message}
              author={author}
              threadReplies={thread ? thread.replies.length : undefined}
              onOpenThread={thread ? () => onOpenThread(thread.id) : undefined}
            />
          )
        })}

        {runId > 0 && agent ? (
          <SimulatedReply key={runId} agent={agent} runId={runId} onCommit={onAppendMessage} />
        ) : null}
      </div>

      <footer className="composer">
        <textarea
          className="composer-field"
          placeholder={`Message #${channel.name}`}
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
        <button type="button" className="send-btn" aria-label="Send" onClick={send}>
          ↑
        </button>
      </footer>
    </main>
  )
}
