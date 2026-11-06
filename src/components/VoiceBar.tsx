import type { Member } from '../platform'
import Avatar from './Avatar'

interface VoiceBarProps {
  participants: Member[]
  label?: string
  speakingName?: string
  elapsed?: string
}

export default function VoiceBar({ participants, label = 'In voice', speakingName, elapsed }: VoiceBarProps) {
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
      <button type="button" className="voice-leave">
        Leave
      </button>
    </div>
  )
}
