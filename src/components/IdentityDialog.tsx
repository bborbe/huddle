import { useState } from 'react'
import { channelInitials, channelToken } from '../lib/channel-identity'

interface IdentityDialogProps {
  onStart: (name: string, avatarToken: 1 | 2 | 3 | 4) => void
  onSkip: () => void
}

/**
 * First-run name dialog. One field only — the colour is derived from the name with
 * the same helper the channel tiles use, and the shuffle just cycles that slot, so
 * the choice stays available without becoming a second question.
 *
 * Skip never blocks the demo: it dismisses for this load and the dialog returns on
 * the next one, because nothing was stored.
 */
export default function IdentityDialog({ onStart, onSkip }: IdentityDialogProps) {
  const [name, setName] = useState('')
  const [tokenOverride, setTokenOverride] = useState<1 | 2 | 3 | 4 | null>(null)

  const trimmed = name.trim()
  const token = tokenOverride ?? (trimmed.length > 0 ? channelToken(trimmed) : 1)
  const initials = trimmed.length > 0 ? channelInitials(trimmed) : '??'

  return (
    <div className="dialog-backdrop">
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Set up your name"
        onSubmit={(event) => {
          event.preventDefault()
          if (trimmed.length > 0) onStart(trimmed, token)
        }}
      >
        <h2 className="dialog-title">What should we call you?</h2>
        <p className="dialog-sub">
          This is how you appear in channels and voice lines. You can skip and keep the demo as it is.
        </p>

        <div className="dialog-preview">
          <span className="chan-tile chan-tile--preview" data-token={token} aria-hidden="true">
            {initials}
          </span>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setTokenOverride((((token % 4) + 1) as 1 | 2 | 3 | 4))}
          >
            Shuffle colour
          </button>
        </div>

        <input
          className="dialog-input"
          autoFocus
          value={name}
          placeholder="Your name"
          aria-label="Your name"
          onChange={(event) => setName(event.target.value)}
        />

        <div className="dialog-actions">
          <button type="button" className="btn-outline" onClick={onSkip}>
            Skip
          </button>
          <button type="submit" className="btn-solid" disabled={trimmed.length === 0}>
            Start
          </button>
        </div>
      </form>
    </div>
  )
}
