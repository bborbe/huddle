import { useState } from 'react'
import type { ToolCall } from '../platform'

interface ToolCallCardProps {
  call: ToolCall
}

export default function ToolCallCard({ call }: ToolCallCardProps) {
  const [open, setOpen] = useState(call.expanded)

  return (
    <div className={`tool tool--${call.state}`}>
      <button
        type="button"
        className="tool-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`tool-dot tool-dot--${call.state}`} aria-hidden="true" />
        <span className="tool-kind">{call.kind}</span>
        <span className="tool-summary">{call.summary}</span>
        <span className="tool-state">{call.state}</span>
        <span className="tool-chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open ? (
        <pre className="tool-detail">
          <code>{call.detail}</code>
        </pre>
      ) : null}
    </div>
  )
}
