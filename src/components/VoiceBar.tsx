import type { Member } from '../platform'
import Avatar from './Avatar'

interface VoiceBarProps {
  participants: Member[]
  label?: string
  speakingName?: string
  elapsed?: string
  /** leaves this voice channel — the bar's Leave button had no handler */
  onLeave?: () => void
}

export default function VoiceBar({
  participants,
  label = 'In voice',
  speakingName,
  elapsed,
  onLeave,
}: VoiceBarProps) {
  if (participants.length === 0) return null

  return (
    <div className="voice-bar">
      <span className="live-dot" aria-hidden="true" />
      <span className="voice-label">{label}</span>
      <span className="voice-avatars">
        {participants.map((p) => (
          <Avatar key={p.id} member={p} size="mini" speaking={p.name === speakingName} />
        ))}
      </span>
      {speakingName ? <span className="voice-speaking">{speakingName} speaking</span> : null}
      {elapsed ? <span className="voice-timer">{elapsed}</span> : null}
      <button type="button" className="voice-leave" onClick={onLeave}>
        Leave
      </button>
    </div>
  )
}
