import { useState } from 'react'
import type { Category, Channel, Member } from '../platform'
import { channelInitials, channelToken } from '../lib/channel-identity'
import { channelsInCategory, starredChannels } from '../lib/selectors'

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

  const starred = starredChannels(channels)

  function closePopup() {
    setCreatingIn(null)
    setDraft('')
  }

  function submit(categoryId: string) {
    const name = draft.trim().replace(/^#/, '')
    // An empty name is not a cancel: it leaves the popup open so the operator can
    // type, rather than silently dismissing it.
    if (name.length === 0) return
    onCreateChannel(categoryId, name)
    closePopup()
  }

  function channelRow(channel: Channel, suffix = '') {
    const voiceMembers = channel.voiceMemberIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is Member => Boolean(m))

    return (
      <>
        <button
          type="button"
          className={`chan-row${channel.id === activeChannelId ? ' chan-row--active' : ''}`}
          onClick={() => onSelectChannel(channel.id)}
          aria-current={channel.id === activeChannelId ? 'true' : undefined}
        >
          <span className="chan-tile" data-token={channelToken(channel.id)} aria-hidden="true">
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

        {suffix === 'threads'
          ? channel.threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`thread-row${thread.id === activeThreadId ? ' thread-row--active' : ''}`}
                title={thread.name}
                onClick={() => onSelectThread(channel.id, thread.id)}
              >
                <span className="thread-connector" aria-hidden="true" />
                <span className="thread-row-name">{thread.name}</span>
              </button>
            ))
          : null}
      </>
    )
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
        {/* Starred sits above the categories and holds the same channels again —
            a second view, not a move. Absent entirely while nothing is starred. */}
        {starred.length > 0 ? (
          <section className="cat" data-section="starred">
            <div className="cat-row">
              <div className="cat-label" aria-label="Starred">
                Starred
              </div>
            </div>
            <ul className="cat-channels">
              {starred.map((channel) => (
                <li key={`starred-${channel.id}`}>{channelRow(channel)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {categories.map((category) => {
          // Revealed on hover, and held open while its popup is open so the popup
          // keeps its anchor when the pointer moves into it.
          const revealing = hoveredCategoryId === category.id || creatingIn === category.id

          return (
            <section
              key={category.id}
              className="cat"
              data-category={category.name}
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
                      <button type="submit" className="btn-solid" disabled={draft.trim().length === 0}>
                        Create
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>

              <ul className="cat-channels">
                {channelsInCategory(category, channels).map((channel) => (
                  <li key={channel.id}>{channelRow(channel, 'threads')}</li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </aside>
  )
}
