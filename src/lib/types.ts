// Shared domain types. Platform-neutral: no DOM, no browser APIs.
// A future native shell imports these unchanged — see src/platform/index.ts.

export type MemberKind = 'human' | 'agent'

export type Presence = 'online' | 'away' | 'offline'

export interface Member {
  id: string
  name: string
  kind: MemberKind
  role: string
  initials: string
  avatarToken: 1 | 2 | 3 | 4
  presence: Presence
}

export type ToolCallState = 'running' | 'success' | 'error'

export interface ToolCall {
  id: string
  /** e.g. "Bash", "Read", "Edit" */
  kind: string
  /** one-line summary shown while collapsed */
  summary: string
  /** detail body shown when expanded */
  detail: string
  state: ToolCallState
  expanded: boolean
}

export interface Message {
  id: string
  authorId: string
  body: string
  sentAt: string
  toolCalls: ToolCall[]
  /** emoji → the member ids who reacted with it. Absent means no reactions. */
  reactions?: Record<string, string[]>
}

export interface Thread {
  id: string
  parentMessageId: string
  name: string
  replies: Message[]
  voiceMemberIds: string[]
}

export interface Channel {
  id: string
  name: string
  topic: string
  messages: Message[]
  threads: Thread[]
  voiceMemberIds: string[]
}

export interface Category {
  id: string
  /** the space this category belongs to — a space switch swaps the whole set */
  spaceId: string
  name: string
  channelIds: string[]
}

export interface Space {
  id: string
  name: string
  initials: string
}

export type ThreadView = 'closed' | 'split' | 'full'

export interface Workspace {
  spaces: Space[]
  members: Member[]
  categories: Category[]
  channels: Channel[]
}
