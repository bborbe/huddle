// Pure state logic. No DOM, no browser APIs — a native shell can reuse this reducer as-is.
// Side effects (ids, timestamps, storage) are supplied by the caller.

import type { Channel, Message, Thread, ThreadView, Workspace } from './types'

export const LOCAL_USER_ID = 'you'

export interface AppState {
  workspace: Workspace
  activeSpaceId: string
  activeChannelId: string
  activeThreadId: string | null
  threadView: ThreadView
}

export type Action =
  | { type: 'selectSpace'; spaceId: string }
  | { type: 'selectChannel'; channelId: string }
  | { type: 'selectThread'; channelId: string; threadId: string }
  | { type: 'setThreadView'; view: ThreadView }
  | { type: 'createChannel'; categoryId: string; channelId: string; name: string }
  | { type: 'sendMessage'; channelId: string; id: string; body: string; sentAt: string }
  | {
      type: 'sendThreadReply'
      channelId: string
      threadId: string
      id: string
      body: string
      sentAt: string
    }
  | { type: 'toggleVoice'; channelId: string; threadId: string | null; memberId: string }
  | {
      type: 'askAgentVoice'
      channelId: string
      threadId: string | null
      agentId: string
      id: string
      body: string
      sentAt: string
    }
  | { type: 'appendMessage'; channelId: string; message: Message }
  | { type: 'toggleReaction'; channelId: string; messageId: string; emoji: string; memberId: string }
  | { type: 'openThreadForMessage'; channelId: string; messageId: string; threadId: string }
  | { type: 'toggleStar'; channelId: string }
  | { type: 'renameChannel'; channelId: string; name: string }
  | { type: 'deleteChannel'; channelId: string }
  | { type: 'setIdentity'; name: string; avatarToken: 1 | 2 | 3 | 4 }
  | { type: 'reset' }

export function initialState(seed: Workspace): AppState {
  // Concept: a thread is selected by default and the view is three columns.
  const firstSpace = seed.spaces[0]
  const firstChannelId = firstSpace
    ? seed.categories.find((cat) => cat.spaceId === firstSpace.id)?.channelIds[0]
    : undefined
  const firstChannel = firstChannelId
    ? seed.channels.find((c) => c.id === firstChannelId)
    : seed.channels[0]
  const firstThread = firstChannel?.threads[0]
  return {
    workspace: seed,
    activeSpaceId: firstSpace ? firstSpace.id : '',
    activeChannelId: firstChannel ? firstChannel.id : '',
    activeThreadId: firstThread ? firstThread.id : null,
    threadView: firstThread ? 'split' : 'closed',
  }
}

/** The first channel of a space — what a space switch lands on. */
function firstChannelOf(workspace: Workspace, spaceId: string): Channel | undefined {
  const channelId = workspace.categories.find((cat) => cat.spaceId === spaceId)?.channelIds[0]
  return channelId ? workspace.channels.find((c) => c.id === channelId) : undefined
}

function updateChannel(
  workspace: Workspace,
  channelId: string,
  fn: (channel: Channel) => Channel,
): Workspace {
  return {
    ...workspace,
    channels: workspace.channels.map((c) => (c.id === channelId ? fn(c) : c)),
  }
}

function updateThread(
  channel: Channel,
  threadId: string,
  fn: (thread: Thread) => Thread,
): Channel {
  return {
    ...channel,
    threads: channel.threads.map((t) => (t.id === threadId ? fn(t) : t)),
  }
}

function toggle(list: string[], memberId: string): string[] {
  return list.includes(memberId) ? list.filter((id) => id !== memberId) : [...list, memberId]
}

export function makeReducer(seed: Workspace) {
  return function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
      case 'selectSpace': {
        if (action.spaceId === state.activeSpaceId) return state
        const channel = firstChannelOf(state.workspace, action.spaceId)
        const thread = channel?.threads[0]
        return {
          ...state,
          activeSpaceId: action.spaceId,
          activeChannelId: channel ? channel.id : '',
          activeThreadId: thread ? thread.id : null,
          threadView: thread ? 'split' : 'closed',
        }
      }

      case 'selectChannel':
        return {
          ...state,
          activeChannelId: action.channelId,
          activeThreadId: null,
          threadView: 'closed',
        }

      case 'selectThread':
        return {
          ...state,
          activeChannelId: action.channelId,
          activeThreadId: action.threadId,
          threadView: 'split',
        }

      case 'setThreadView':
        return { ...state, threadView: action.view }

      case 'createChannel': {
        const channel: Channel = {
          id: action.channelId,
          name: action.name,
          topic: 'New channel',
          messages: [],
          threads: [],
          voiceMemberIds: [],
        }
        const categories = state.workspace.categories
        // The category row that opened the popup owns the channel; fall back to the
        // first category if that id is gone (a stale popup over a reset workspace).
        const targetId = categories.some((cat) => cat.id === action.categoryId)
          ? action.categoryId
          : categories[0]?.id
        return {
          ...state,
          workspace: {
            ...state.workspace,
            channels: [...state.workspace.channels, channel],
            categories: targetId
              ? categories.map((cat) =>
                  cat.id === targetId
                    ? { ...cat, channelIds: [...cat.channelIds, channel.id] }
                    : cat,
                )
              : categories,
          },
          activeChannelId: channel.id,
          activeThreadId: null,
          threadView: 'closed',
        }
      }

      case 'sendMessage': {
        const message = {
          id: action.id,
          authorId: LOCAL_USER_ID,
          body: action.body,
          sentAt: action.sentAt,
          toolCalls: [],
        }
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) => ({
            ...channel,
            messages: [...channel.messages, message],
          })),
        }
      }

      case 'sendThreadReply': {
        const reply = {
          id: action.id,
          authorId: LOCAL_USER_ID,
          body: action.body,
          sentAt: action.sentAt,
          toolCalls: [],
        }
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) =>
            updateThread(channel, action.threadId, (thread) => ({
              ...thread,
              replies: [...thread.replies, reply],
            })),
          ),
        }
      }

      case 'toggleVoice': {
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) => {
            if (action.threadId) {
              return updateThread(channel, action.threadId, (thread) => ({
                ...thread,
                voiceMemberIds: toggle(thread.voiceMemberIds, action.memberId),
              }))
            }
            return {
              ...channel,
              voiceMemberIds: toggle(channel.voiceMemberIds, action.memberId),
            }
          }),
        }
      }

      case 'askAgentVoice': {
        const reply = {
          id: action.id,
          authorId: action.agentId,
          body: action.body,
          sentAt: action.sentAt,
          toolCalls: [],
        }
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) => {
            if (action.threadId) {
              return updateThread(channel, action.threadId, (thread) => ({
                ...thread,
                replies: [...thread.replies, reply],
                voiceMemberIds: thread.voiceMemberIds.includes(action.agentId)
                  ? thread.voiceMemberIds
                  : [...thread.voiceMemberIds, action.agentId],
              }))
            }
            return {
              ...channel,
              messages: [...channel.messages, reply],
              voiceMemberIds: channel.voiceMemberIds.includes(action.agentId)
                ? channel.voiceMemberIds
                : [...channel.voiceMemberIds, action.agentId],
            }
          }),
        }
      }

      case 'appendMessage':
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) => ({
            ...channel,
            messages: [...channel.messages, action.message],
          })),
        }

      case 'toggleReaction': {
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) => ({
            ...channel,
            messages: channel.messages.map((message) => {
              if (message.id !== action.messageId) return message
              const current = message.reactions?.[action.emoji] ?? []
              const next = toggle(current, action.memberId)
              const reactions = { ...message.reactions }
              // Drop the emoji entirely once nobody is left on it, so an empty
              // chip never renders and the persisted shape stays clean.
              if (next.length === 0) delete reactions[action.emoji]
              else reactions[action.emoji] = next
              return { ...message, reactions }
            }),
          })),
        }
      }

      case 'openThreadForMessage': {
        const channel = state.workspace.channels.find((c) => c.id === action.channelId)
        if (!channel) return state

        // Replying to a message with no thread starts one, the way Slack and
        // Google Chat do — the panel is bound to the message, not to a pre-existing
        // thread.
        const existing = channel.threads.find((t) => t.parentMessageId === action.messageId)
        if (existing) {
          return {
            ...state,
            activeChannelId: action.channelId,
            activeThreadId: existing.id,
            threadView: 'split',
          }
        }

        const parent = channel.messages.find((m) => m.id === action.messageId)
        const thread: Thread = {
          id: action.threadId,
          parentMessageId: action.messageId,
          name: parent ? parent.body.slice(0, 40) : 'thread',
          replies: [],
          voiceMemberIds: [],
        }
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (c) => ({
            ...c,
            threads: [...c.threads, thread],
          })),
          activeChannelId: action.channelId,
          activeThreadId: thread.id,
          threadView: 'split',
        }
      }

      case 'toggleStar':
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) => ({
            ...channel,
            starred: !channel.starred,
          })),
        }

      case 'setIdentity': {
        // A name that collides with a seeded member is disambiguated, never
        // blocked — the demo must always be startable.
        const clash = state.workspace.members.some(
          (member) =>
            member.id !== LOCAL_USER_ID && member.name.toLowerCase() === action.name.toLowerCase(),
        )
        const name = clash ? `${action.name} (you)` : action.name
        const initials = name.slice(0, 2).toUpperCase()

        return {
          ...state,
          workspace: {
            ...state.workspace,
            identity: { name, avatarToken: action.avatarToken },
            members: state.workspace.members.map((member) =>
              member.id === LOCAL_USER_ID
                ? { ...member, name, initials, avatarToken: action.avatarToken }
                : member,
            ),
          },
        }
      }

      case 'renameChannel':
        return {
          ...state,
          workspace: updateChannel(state.workspace, action.channelId, (channel) => ({
            ...channel,
            name: action.name,
          })),
        }

      case 'deleteChannel': {
        const channels = state.workspace.channels.filter((c) => c.id !== action.channelId)
        if (channels.length === state.workspace.channels.length) return state

        const categories = state.workspace.categories.map((cat) => ({
          ...cat,
          channelIds: cat.channelIds.filter((id) => id !== action.channelId),
        }))

        // Deleting the active channel must leave a valid selection, never an empty
        // shell: take a neighbour from the same category, else the first channel.
        if (state.activeChannelId !== action.channelId) {
          return { ...state, workspace: { ...state.workspace, channels, categories } }
        }

        const home = state.workspace.categories.find((cat) => cat.channelIds.includes(action.channelId))
        const neighbourId = home?.channelIds.find(
          (id) => id !== action.channelId && channels.some((c) => c.id === id),
        )
        const neighbour = neighbourId
          ? channels.find((c) => c.id === neighbourId)
          : channels[0]

        return {
          ...state,
          workspace: { ...state.workspace, channels, categories },
          activeChannelId: neighbour ? neighbour.id : '',
          activeThreadId: null,
          threadView: 'closed',
        }
      }

      case 'reset':
        return initialState(seed)

      default:
        return state
    }
  }
}
