import { useEffect, useMemo, useReducer, useState } from 'react'
import { workspace } from './lib/fixtures'
import { initialState, LOCAL_USER_ID, makeReducer } from './lib/workspace-state'
import type { AppState } from './lib/workspace-state'
import { loadState, newId, nowIso, saveState } from './platform/storage'
import SpaceRail from './components/SpaceRail'
import Sidebar from './components/Sidebar'
import ChannelPane from './components/ChannelPane'
import ThreadPane from './components/ThreadPane'
import IdentityDialog from './components/IdentityDialog'

const AGENT_ID = 'forge'

export default function App() {
  const reducer = useMemo(() => makeReducer(workspace), [])
  const [state, dispatch] = useReducer(reducer, workspace, (seed) =>
    loadState<AppState>(initialState(seed)),
  )

  useEffect(() => {
    saveState(state)
  }, [state])

  // Exposed for the Playwright walks: SC3 asserts each control's effect against
  // the model, and SC6 reads the seeded model on the production build.
  useEffect(() => {
    ;(window as unknown as { __huddle?: { state: AppState; dispatch: unknown } }).__huddle = {
      state,
      dispatch,
    }
  }, [state])

  // Skip is deliberately NOT persisted: the dialog returns on the next load,
  // because nothing was stored. A demo must never be blocked.
  const [identitySkipped, setIdentitySkipped] = useState(false)

  const { spaces, members, categories, channels } = state.workspace

  // A space owns its own categories, so a switch swaps the whole sidebar set.
  const spaceCategories = useMemo(
    () => categories.filter((category) => category.spaceId === state.activeSpaceId),
    [categories, state.activeSpaceId],
  )

  const channel = useMemo(() => {
    const active = channels.find((c) => c.id === state.activeChannelId)
    if (active) return active
    const firstId = spaceCategories[0]?.channelIds[0]
    return firstId ? channels.find((c) => c.id === firstId) : channels[0]
  }, [channels, state.activeChannelId, spaceCategories])

  const thread = useMemo(() => {
    if (!channel || !state.activeThreadId) return undefined
    return channel.threads.find((t) => t.id === state.activeThreadId)
  }, [channel, state.activeThreadId])

  if (!channel) return null

  const showThread = Boolean(thread) && state.threadView !== 'closed'

  const channelVoice = channel.voiceMemberIds.includes(LOCAL_USER_ID)
  const threadVoice = thread ? thread.voiceMemberIds.includes(LOCAL_USER_ID) : false

  return (
    <div className={`shell${state.threadView === 'full' ? ' shell--thread-full' : ''}`}>
      <SpaceRail
        spaces={spaces}
        activeId={state.activeSpaceId}
        onSelectSpace={(spaceId) => dispatch({ type: 'selectSpace', spaceId })}
      />

      <Sidebar
        spaceName={spaces.find((space) => space.id === state.activeSpaceId)?.name ?? 'Huddle'}
        categories={spaceCategories}
        channels={channels}
        members={members}
        activeChannelId={channel.id}
        activeThreadId={showThread ? state.activeThreadId : null}
        onSelectChannel={(channelId) => dispatch({ type: 'selectChannel', channelId })}
        onSelectThread={(channelId, threadId) =>
          dispatch({ type: 'selectThread', channelId, threadId })
        }
        onCreateChannel={(categoryId, name) =>
          dispatch({ type: 'createChannel', categoryId, channelId: newId(), name })
        }
        onRenameChannel={(channelId, name) => dispatch({ type: 'renameChannel', channelId, name })}
        onDeleteChannel={(channelId) => dispatch({ type: 'deleteChannel', channelId })}
        onToggleChannelVoice={(channelId) =>
          dispatch({ type: 'toggleVoice', channelId, threadId: null, memberId: LOCAL_USER_ID })
        }
        onMoveChannel={(categoryId, channelId, toIndex) =>
          dispatch({ type: 'moveChannel', categoryId, channelId, toIndex })
        }
        onReset={() => dispatch({ type: 'reset' })}
      />

      {state.threadView === 'full' ? null : (
        <ChannelPane
          channel={channel}
          members={members}
          agent={members.find((m) => m.id === AGENT_ID)}
          inVoice={channelVoice}
          localUserId={LOCAL_USER_ID}
          starred={Boolean(channel.starred)}
          onToggleStar={() => dispatch({ type: 'toggleStar', channelId: channel.id })}
          onReplyToMessage={(messageId) =>
            dispatch({
              type: 'openThreadForMessage',
              channelId: channel.id,
              messageId,
              threadId: newId(),
            })
          }
          onReact={(messageId, emoji) =>
            dispatch({
              type: 'toggleReaction',
              channelId: channel.id,
              messageId,
              emoji,
              memberId: LOCAL_USER_ID,
            })
          }
          onAppendMessage={(message) =>
            dispatch({ type: 'appendMessage', channelId: channel.id, message })
          }
          onOpenThread={(threadId) =>
            dispatch({ type: 'selectThread', channelId: channel.id, threadId })
          }
          onSendMessage={(body) =>
            dispatch({
              type: 'sendMessage',
              channelId: channel.id,
              id: newId(),
              body,
              sentAt: nowIso(),
            })
          }
          onToggleVoice={() =>
            dispatch({
              type: 'toggleVoice',
              channelId: channel.id,
              threadId: null,
              memberId: LOCAL_USER_ID,
            })
          }
          onAskAgentVoice={() =>
            dispatch({
              type: 'askAgentVoice',
              channelId: channel.id,
              threadId: null,
              agentId: AGENT_ID,
              id: newId(),
              body: 'Joining voice now — say the word when you want me to leave.',
              sentAt: nowIso(),
            })
          }
        />
      )}

      {showThread && thread ? (
        <ThreadPane
          channel={channel}
          thread={thread}
          members={members}
          view={state.threadView}
          inVoice={threadVoice}
          onExpand={() => dispatch({ type: 'setThreadView', view: 'full' })}
          onRestore={() => dispatch({ type: 'setThreadView', view: 'split' })}
          onClose={() => {
            dispatch({ type: 'setThreadView', view: 'closed' })
            dispatch({ type: 'selectChannel', channelId: channel.id })
          }}
          onSendReply={(body) =>
            dispatch({
              type: 'sendThreadReply',
              channelId: channel.id,
              threadId: thread.id,
              id: newId(),
              body,
              sentAt: nowIso(),
            })
          }
          onToggleVoice={() =>
            dispatch({
              type: 'toggleVoice',
              channelId: channel.id,
              threadId: thread.id,
              memberId: LOCAL_USER_ID,
            })
          }
          onAskAgentVoice={() =>
            dispatch({
              type: 'askAgentVoice',
              channelId: channel.id,
              threadId: thread.id,
              agentId: AGENT_ID,
              id: newId(),
              body: 'Joining this thread’s voice.',
              sentAt: nowIso(),
            })
          }
        />
      ) : null}
      {!state.workspace.identity && !identitySkipped ? (
        <IdentityDialog
          onStart={(name, avatarToken) => dispatch({ type: 'setIdentity', name, avatarToken })}
          onSkip={() => setIdentitySkipped(true)}
        />
      ) : null}
    </div>
  )
}
