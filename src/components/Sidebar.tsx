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
  onRenameChannel: (channelId: string, name: string) => void
  onDeleteChannel: (channelId: string) => void
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
  onRenameChannel,
  onDeleteChannel,
  onReset,
}: SidebarProps) {
  // Hover is view state, not model state: the create affordance exists only while
  // its category row is hovered, exactly like Slack's channel section header.
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  // Channel-row affordances: a gear revealed on hover opens the channel settings
  // dialog, where rename and delete live (Discord's shape, not a dropdown menu).
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null)
  const [settingsChannelId, setSettingsChannelId] = useState<string | null>(null)
  const [settingsName, setSettingsName] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const starred = starredChannels(channels)
  const settingsChannel = channels.find((channel) => channel.id === settingsChannelId)

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

  function openSettings(channel: Channel) {
    setSettingsChannelId(channel.id)
    setSettingsName(channel.name)
    setConfirmingDelete(false)
  }

  function closeSettings() {
    setSettingsChannelId(null)
    setConfirmingDelete(false)
  }

  function saveSettings(channelId: string) {
    const name = settingsName.trim().replace(/^#/, '')
    if (name.length === 0) return
    if (name !== channels.find((c) => c.id === channelId)?.name) {
      onRenameChannel(channelId, name)
    }
    closeSettings()
  }

  function channelButton(channel: Channel) {
    return (
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
    )
  }

  function voiceLine(channel: Channel) {
    const voiceMembers = channel.voiceMemberIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is Member => Boolean(m))

    if (voiceMembers.length === 0) return null
    return (
      <div className="voice-line">
        <span className="live-dot" aria-hidden="true" />
        {voiceMembers.map((m) => m.name).join(', ')} in voice
      </div>
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
                <li key={`starred-${channel.id}`}>{channelButton(channel)}</li>
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
                {channelsInCategory(category, channels).map((channel) => {
                  const revealingRow = hoveredChannelId === channel.id

                  return (
                    <li key={channel.id}>
                      <div
                        className="chan-wrap"
                        onMouseEnter={() => setHoveredChannelId(channel.id)}
                        onMouseLeave={() =>
                          setHoveredChannelId((id) => (id === channel.id ? null : id))
                        }
                      >
                        {channelButton(channel)}

                        {revealingRow ? (
                          <button
                            type="button"
                            className="icon-btn chan-gear"
                            aria-label="Channel settings"
                            title="Channel settings"
                            onClick={() => openSettings(channel)}
                          >
                            ⚙
                          </button>
                        ) : null}
                      </div>

                      {voiceLine(channel)}

                      {channel.threads.map((thread) => (
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
                      ))}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {settingsChannel ? (
        <div className="dialog-backdrop">
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Channel settings for ${settingsChannel.name}`}
          >
            <h2 className="dialog-title">Channel settings</h2>

            {confirmingDelete ? (
              <>
                <p className="dialog-sub">
                  Delete #{settingsChannel.name}? Its {settingsChannel.messages.length}{' '}
                  {settingsChannel.messages.length === 1 ? 'message' : 'messages'} and{' '}
                  {settingsChannel.threads.length}{' '}
                  {settingsChannel.threads.length === 1 ? 'thread' : 'threads'} go with it. This
                  cannot be undone.
                </p>
                <div className="dialog-actions">
                  <button type="button" className="btn-outline" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      onDeleteChannel(settingsChannel.id)
                      closeSettings()
                    }}
                  >
                    Delete channel
                  </button>
                </div>
              </>
            ) : (
              <form
                className="dialog-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  saveSettings(settingsChannel.id)
                }}
              >
                <label className="cat-popup-label" htmlFor="channel-settings-name">
                  Name
                </label>
                <input
                  id="channel-settings-name"
                  className="dialog-input"
                  autoFocus
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                />

                <div className="dialog-actions">
                  <button type="button" className="btn-outline" onClick={closeSettings}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-solid" disabled={settingsName.trim().length === 0}>
                    Save
                  </button>
                </div>

                <div className="dialog-danger">
                  <button type="button" className="btn-danger" onClick={() => setConfirmingDelete(true)}>
                    Delete channel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
