import { useState } from 'react'
import type { Category, Channel, Member } from '../platform'
import { channelInitials, channelToken } from '../lib/channel-identity'

interface SidebarProps {
  categories: Category[]
  channels: Channel[]
  members: Member[]
  activeChannelId: string
  activeThreadId: string | null
  onSelectChannel: (channelId: string) => void
  onSelectThread: (channelId: string, threadId: string) => void
  onCreateChannel: (name: string) => void
  onReset: () => void
}

export default function Sidebar({
  categories,
  channels,
  members,
  activeChannelId,
  activeThreadId,
  onSelectChannel,
  onSelectThread,
  onCreateChannel,
  onReset,
}: SidebarProps) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')

  const channelById = new Map(channels.map((c) => [c.id, c]))

  function submit() {
    const name = draft.trim().replace(/^#/, '')
    if (name.length > 0) onCreateChannel(name)
    setDraft('')
    setCreating(false)
  }

  return (
    <aside className="panel sidebar">
      <header className="panel-header">
        <span>Huddle</span>
        <span className="panel-header-spacer" />
        <button
          type="button"
          className="icon-btn"
          aria-label="New channel"
          onClick={() => setCreating((v) => !v)}
        >
          +
        </button>
        <button type="button" className="icon-btn" aria-label="Reset demo" onClick={onReset}>
          ⟲
        </button>
      </header>

      <div className="panel-body sidebar-body">
        {creating ? (
          <form
            className="new-channel"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <input
              className="new-channel-input"
              autoFocus
              value={draft}
              placeholder="new-channel"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDraft('')
                  setCreating(false)
                }
              }}
            />
          </form>
        ) : null}

        {categories.map((category) => (
          <section key={category.id} className="cat">
            {/* Category label: groups channels, never selectable, no composer. */}
            <div className="cat-label" aria-label={`Category ${category.name}`}>
              {category.name}
            </div>
            <ul className="cat-channels">
              {category.channelIds.map((channelId) => {
                const channel = channelById.get(channelId)
                if (!channel) return null

                const voiceMembers = channel.voiceMemberIds
                  .map((id) => members.find((m) => m.id === id))
                  .filter((m): m is Member => Boolean(m))

                return (
                  <li key={channel.id}>
                    <button
                      type="button"
                      className={`chan-row${channel.id === activeChannelId ? ' chan-row--active' : ''}`}
                      onClick={() => onSelectChannel(channel.id)}
                      aria-current={channel.id === activeChannelId ? 'true' : undefined}
                    >
                      <span
                        className="chan-tile"
                        data-token={channelToken(channel.id)}
                        aria-hidden="true"
                      >
                        {channelInitials(channel.name)}
                      </span>
                      {channel.name}
                    </button>

                    {voiceMembers.length > 0 ? (
                      <div className="voice-line">
                        <span className="live-dot" aria-hidden="true" />
                        {voiceMembers.map((m) => m.name).join(', ')} in voice
                      </div>
                    ) : null}

                    {channel.threads.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        className={`thread-row${thread.id === activeThreadId ? ' thread-row--active' : ''}`}
                        onClick={() => onSelectThread(channel.id, thread.id)}
                      >
                        <span className="thread-connector" aria-hidden="true" />
                        {thread.name}
                      </button>
                    ))}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  )
}
