import type { Member } from '../platform'
import Avatar from './Avatar'

interface VoiceBarProps {
  participants: Member[]
  label?: string
  speakingName?: string
  elapsed?: string
}

/**
 * The in-room strip: who is here and what they are saying. It carries no
 * controls — joining and leaving are the sidebar row's double click, and the
 * hang-up / mute / deafen controls live in the voice panel (SC27).
 */
export default function VoiceBar({
  participants,
  label = 'In voice',
  speakingName,
  elapsed,
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
    </div>
  )
}
