import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { workspace } from './lib/fixtures'
import { initialState, LOCAL_USER_ID, makeReducer, normaliseVoice } from './lib/workspace-state'
import type { Action, AppState } from './lib/workspace-state'
import { loadState, saveState } from './platform/storage'
import { createMockTransport } from './platform/transport'
import { activeVoiceRoom } from './lib/selectors'
import SpaceRail from './components/SpaceRail'
import Sidebar from './components/Sidebar'
import ChannelPane from './components/ChannelPane'
import ThreadPane from './components/ThreadPane'
import IdentityDialog from './components/IdentityDialog'

const AGENT_ID = 'forge'

export default function App() {
  const reducer = useMemo(() => makeReducer(workspace), [])
  const [state, applyAction] = useReducer(reducer, workspace, (seed) =>
    normaliseVoice(loadState<AppState>(initialState(seed))),
  )

  // Every user action leaves through the transport seam. The mock applies it to
  // the reducer directly; a WebSocket transport would also ship it to the server.
  const transport = useMemo(() => createMockTransport(applyAction), [applyAction])
  const dispatch = useCallback((action: Action) => transport.send(action), [transport])

  useEffect(() => {
    saveState(state)
  }, [state])

  // Inbound: a real transport pushes agent replies and presence here. The mock
  // never emits, so this stays silent until a backend exists.
  useEffect(
    () =>
      transport.subscribe((event) => {
        if (event.type === 'agentReply') {
          applyAction({
            type: 'appendMessage',
            channelId: event.channelId,
            message: event.message,
          })
        }
      }),
    [transport],
  )

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

  // The panel is the only voice surface left: joining and leaving are the
  // sidebar row's double click, and the panel appears while a room is joined.
  const voiceRoom = useMemo(
    () => activeVoiceRoom(state.workspace, LOCAL_USER_ID),
    [state.workspace],
  )
  const localUser = members.find((member) => member.id === LOCAL_USER_ID)

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
          dispatch({ type: 'createChannel', categoryId, channelId: transport.newId(), name })
        }
        onRenameChannel={(channelId, name) => dispatch({ type: 'renameChannel', channelId, name })}
        onDeleteChannel={(channelId) => dispatch({ type: 'deleteChannel', channelId })}
        onToggleChannelVoice={(channelId) =>
          dispatch({ type: 'toggleVoice', channelId, threadId: null, memberId: LOCAL_USER_ID })
        }
        onToggleThreadVoice={(channelId, threadId) =>
          dispatch({ type: 'toggleVoice', channelId, threadId, memberId: LOCAL_USER_ID })
        }
        voiceRoomName={voiceRoom?.name ?? null}
        localUser={localUser}
        muted={state.workspace.voice?.muted ?? false}
        deafened={state.workspace.voice?.deafened ?? false}
        onHangUp={() => {
          if (!voiceRoom) return
          dispatch({
            type: 'toggleVoice',
            channelId: voiceRoom.channelId,
            threadId: voiceRoom.threadId,
            memberId: LOCAL_USER_ID,
          })
        }}
        onToggleMute={() => dispatch({ type: 'toggleMute' })}
        onToggleDeafen={() => dispatch({ type: 'toggleDeafen' })}
        onReset={() => dispatch({ type: 'reset' })}
      />

      {state.threadView === 'full' ? null : (
        <ChannelPane
          channel={channel}
          members={members}
          agent={members.find((m) => m.id === AGENT_ID)}
          localUserId={LOCAL_USER_ID}
          starred={Boolean(channel.starred)}
          onToggleStar={() => dispatch({ type: 'toggleStar', channelId: channel.id })}
          onReplyToMessage={(messageId) =>
            dispatch({
              type: 'openThreadForMessage',
              channelId: channel.id,
              messageId,
              threadId: transport.newId(),
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
              id: transport.newId(),
              body,
              sentAt: transport.now(),
            })
          }
          onAskAgentVoice={() =>
            dispatch({
              type: 'askAgentVoice',
              channelId: channel.id,
              threadId: null,
              agentId: AGENT_ID,
              id: transport.newId(),
              body: 'Joining voice now — say the word when you want me to leave.',
              sentAt: transport.now(),
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
          onExpand={() => dispatch({ type: 'setThreadView', view: 'full' })}
          onRestore={() => dispatch({ type: 'setThreadView', view: 'split' })}
          localUserId={LOCAL_USER_ID}
          onReact={(messageId, emoji) =>
            dispatch({
              type: 'toggleReaction',
              channelId: channel.id,
              threadId: thread.id,
              messageId,
              emoji,
              memberId: LOCAL_USER_ID,
            })
          }
          onClose={() => {
            dispatch({ type: 'setThreadView', view: 'closed' })
            dispatch({ type: 'selectChannel', channelId: channel.id })
          }}
          onSendReply={(body) =>
            dispatch({
              type: 'sendThreadReply',
              channelId: channel.id,
              threadId: thread.id,
              id: transport.newId(),
              body,
              sentAt: transport.now(),
            })
          }
          onAskAgentVoice={() =>
            dispatch({
              type: 'askAgentVoice',
              channelId: channel.id,
              threadId: thread.id,
              agentId: AGENT_ID,
              id: transport.newId(),
              body: 'Joining this thread’s voice.',
              sentAt: transport.now(),
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
