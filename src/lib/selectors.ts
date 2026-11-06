// Model selectors. Pure and platform-neutral: no DOM, no browser APIs.
// A native shell reuses these unchanged.

import type { Category, Channel, Workspace } from './types'

/**
 * A category's channels in **case-insensitive alphabetical order**.
 *
 * Creation order is arbitrary and gets distracting past a handful of channels, so
 * the order is derived here rather than stored — a channel created later lands in
 * its alphabetical place instead of at the end. If custom ordering is ever wanted
 * it becomes an `order` field on the channel and this comparator is replaced, not
 * extended.
 */
export function channelsInCategory(category: Category, channels: Channel[]): Channel[] {
  const byId = new Map(channels.map((channel) => [channel.id, channel]))
  return category.channelIds
    .map((id) => byId.get(id))
    .filter((channel): channel is Channel => Boolean(channel))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

/**
 * The channels pinned into the Starred section, alphabetically.
 *
 * A starred channel appears here **and** stays in its own category — this is a
 * second view of the same channel, not a move.
 */
export function starredChannels(channels: Channel[]): Channel[] {
  return channels
    .filter((channel) => channel.starred)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

/** The room the given member is in, channel or thread — at most one, by SC25. */
export interface VoiceRoom {
  channelId: string
  threadId: string | null
  name: string
}

export function activeVoiceRoom(workspace: Workspace, memberId: string): VoiceRoom | null {
  for (const channel of workspace.channels) {
    if (channel.voiceMemberIds.includes(memberId)) {
      return { channelId: channel.id, threadId: null, name: channel.name }
    }
    for (const thread of channel.threads) {
      if (thread.voiceMemberIds.includes(memberId)) {
        return { channelId: channel.id, threadId: thread.id, name: thread.name }
      }
    }
  }
  return null
}
