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
  onCreateChannel: (categoryId: string, name: string) => void
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
  // Hover is view state, not model state: the create affordance exists only while
  // its category row is hovered, exactly like Slack's channel section header.
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const channelById = new Map(channels.map((c) => [c.id, c]))

  function closePopup() {
    setCreatingIn(null)
    setDraft('')
  }

  function submit(categoryId: string) {
    const name = draft.trim().replace(/^#/, '')
    if (name.length > 0) onCreateChannel(categoryId, name)
    closePopup()
  }

  return (
    <aside className="panel sidebar">
      <header className="panel-header">
        <span>Huddle</span>
        <span className="panel-header-spacer" />
        <button type="button" className="icon-btn" aria-label="Reset demo" onClick={onReset}>
          ⟲
        </button>
      </header>

      <div className="panel-body sidebar-body">
        {categories.map((category) => {
          // Revealed on hover, and held open while its popup is open so the popup
          // keeps its anchor when the pointer moves into it.
          const revealing = hoveredCategoryId === category.id || creatingIn === category.id

          return (
            <section
              key={category.id}
              className="cat"
              onMouseEnter={() => setHoveredCategoryId(category.id)}
              onMouseLeave={() =>
                setHoveredCategoryId((id) => (id === category.id ? null : id))
              }
            >
              {/* Category row: the label groups channels and is never selectable. */}
              <div className="cat-row">
                <div className="cat-label" aria-label={`Category ${category.name}`}>
                  {category.name}
                </div>

                {revealing ? (
                  <button
                    type="button"
                    className="icon-btn cat-add"
                    aria-label="Create a channel"
                    title="Create a channel"
                    onClick={() => {
                      setDraft('')
                      setCreatingIn(category.id)
                    }}
                  >
                    +
                  </button>
                ) : null}

                {creatingIn === category.id ? (
                  <form
                    className="cat-popup"
                    onSubmit={(e) => {
                      e.preventDefault()
                      submit(category.id)
                    }}
                  >
                    <label className="cat-popup-label" htmlFor={`new-channel-${category.id}`}>
                      Create a channel in {category.name}
                    </label>
                    <input
                      id={`new-channel-${category.id}`}
                      className="cat-popup-input"
                      autoFocus
                      value={draft}
                      placeholder="channel-name"
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') closePopup()
                      }}
                    />
                    <div className="cat-popup-actions">
                      <button type="button" className="btn-outline" onClick={closePopup}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-solid">
                        Create
                      </button>
                    </div>
                  </form>
                ) : null}
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
          )
        })}
      </div>
    </aside>
  )
}
