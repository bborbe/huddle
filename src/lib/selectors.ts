// Model selectors. Pure and platform-neutral: no DOM, no browser APIs.
// A native shell reuses these unchanged.

import type { Category, Channel } from './types'

/**
 * A category's channels **in the order the operator arranged them**.
 *
 * `Category.channelIds` is the source of truth: a channel created later is appended
 * to the end of its category, and dragging a row rewrites the order. This replaced
 * an alphabetical comparator — a stored order and a sort cannot both own the list,
 * and the operator asked for drag-and-drop.
 */
export function channelsInCategory(category: Category, channels: Channel[]): Channel[] {
  const byId = new Map(channels.map((channel) => [channel.id, channel]))
  return category.channelIds
    .map((id) => byId.get(id))
    .filter((channel): channel is Channel => Boolean(channel))
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
