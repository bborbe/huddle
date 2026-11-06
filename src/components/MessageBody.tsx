import { parseMessage } from '../lib/message-format'

/**
 * Renders a message body. Inline `code` becomes a `<code>` element and a fenced
 * block becomes `<pre><code>`; every other character renders as typed.
 */
export default function MessageBody({ body }: { body: string }) {
  const segments = parseMessage(body)

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'code') {
          return (
            <code key={index} className="md-code">
              {segment.value}
            </code>
          )
        }
        if (segment.kind === 'codeBlock') {
          return (
            <pre key={index} className="md-code-block">
              <code>{segment.value}</code>
            </pre>
          )
        }
        return <span key={index}>{segment.value}</span>
      })}
    </>
  )
}
