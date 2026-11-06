// Message formatting — deliberately minimal.
//
// Only two constructs render: inline `code` and ``` fenced ``` code blocks.
// Everything else stays literal, so `**bold**`, `*italic*`, `[t](u)`, `- item` and
// `# heading` appear exactly as typed. That is a design decision, not an omission:
// lists and headings are the first constructs that need block-level parsing, and
// Slack does not render lists at all.
//
// The message body is stored as CommonMark, so a later channel adapter can map
// these two constructs per platform instead of rewriting the text.

export type MessageSegment =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'codeBlock'; value: string }

const FENCE = /```[^\n]*\n?([\s\S]*?)```/g
const INLINE = /`([^`\n]+)`/g

/** Split a message body into literal text, inline code and fenced code blocks. */
export function parseMessage(body: string): MessageSegment[] {
  const segments: MessageSegment[] = []
  let cursor = 0

  for (const match of body.matchAll(FENCE)) {
    const start = match.index ?? 0
    if (start > cursor) segments.push(...parseInline(body.slice(cursor, start)))
    // CommonMark does not count the newline before the closing fence as content.
    segments.push({ kind: 'codeBlock', value: (match[1] ?? '').replace(/\n$/, '') })
    cursor = start + match[0].length
  }

  if (cursor < body.length) segments.push(...parseInline(body.slice(cursor)))
  return segments
}

function parseInline(text: string): MessageSegment[] {
  const segments: MessageSegment[] = []
  let cursor = 0

  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0
    if (start > cursor) segments.push({ kind: 'text', value: text.slice(cursor, start) })
    segments.push({ kind: 'code', value: match[1] ?? '' })
    cursor = start + match[0].length
  }

  if (cursor < text.length) segments.push({ kind: 'text', value: text.slice(cursor) })
  return segments
}
