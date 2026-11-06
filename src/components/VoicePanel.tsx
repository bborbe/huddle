import type { Member } from '../platform'
import Avatar from './Avatar'

interface VoicePanelProps {
  /** the room the local member is in — a channel or a thread */
  roomName: string
  member: Member
  muted: boolean
  deafened: boolean
  onHangUp: () => void
  onToggleMute: () => void
  onToggleDeafen: () => void
}

/**
 * Discord-classic voice panel, pinned to the bottom of the sidebar and rendered
 * only while the local member is in a voice room.
 *
 * The mockup this follows also carried a settings gear. It is deliberately
 * omitted: it had no effect, and a decorative button is the dead-control defect
 * this build has spent the evening removing. Mic and deafen are model state
 * (SC27) — there is no microphone and no audio in this prototype.
 */
export default function VoicePanel({
  roomName,
  member,
  muted,
  deafened,
  onHangUp,
  onToggleMute,
  onToggleDeafen,
}: VoicePanelProps) {
  return (
    <div className="voice-panel" data-section="voice-panel">
      <div className="vp-top">
        <div className="vp-room">
          <span className="vp-state">● Voice Connected</span>
          <span className="vp-room-name">{roomName}</span>
        </div>
        <button
          type="button"
          className="vp-ic vp-ic--hang"
          aria-label="Disconnect from voice"
          title="Disconnect"
          onClick={onHangUp}
        >
          ⏻
        </button>
      </div>

      <div className="vp-user">
        <Avatar member={member} size="mini" />
        <div className="vp-who">
          <b>{member.name}</b>
          <span>In voice</span>
        </div>
        <button
          type="button"
          className={`vp-ic${muted ? ' vp-ic--mute' : ''}`}
          aria-label={muted ? 'Unmute myself' : 'Mute myself'}
          aria-pressed={muted}
          title={muted ? 'Unmute' : 'Mute'}
          onClick={onToggleMute}
        >
          🎤
        </button>
        <button
          type="button"
          className={`vp-ic${deafened ? ' vp-ic--deaf' : ''}`}
          aria-label={deafened ? 'Undeafen' : 'Deafen'}
          aria-pressed={deafened}
          title={deafened ? 'Undeafen' : 'Deafen'}
          onClick={onToggleDeafen}
        >
          🎧
        </button>
      </div>
    </div>
  )
}
