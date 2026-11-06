import { useEffect, useMemo, useReducer } from 'react'
import { workspace } from './lib/fixtures'
import { initialState, LOCAL_USER_ID, makeReducer } from './lib/workspace-state'
import type { AppState } from './lib/workspace-state'
import { loadState, newId, nowIso, saveState } from './platform/storage'
import SpaceRail from './components/SpaceRail'
import Sidebar from './components/Sidebar'
import ChannelPane from './components/ChannelPane'
import ThreadPane from './components/ThreadPane'

const SPACES = [
  { id: 'huddle', initials: 'H' },
  { id: 'decisions', initials: 'DA' },
]

const AGENT_ID = 'forge'

export default function App() {
  const reducer = useMemo(() => makeReducer(workspace), [])
  const [state, dispatch] = useReducer(reducer, workspace, (seed) =>
    loadState<AppState>(initialState(seed)),
  )

  useEffect(() => {
    saveState(state)
  }, [state])

  const { members, categories, channels } = state.workspace

  const channel = useMemo(
    () => channels.find((c) => c.id === state.activeChannelId) ?? channels[0],
    [channels, state.activeChannelId],
  )

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
      <SpaceRail spaces={SPACES} activeId="huddle" />

      <Sidebar
        categories={categories}
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
        onReset={() => dispatch({ type: 'reset' })}
      />

      {state.threadView === 'full' ? null : (
        <ChannelPane
          channel={channel}
          members={members}
          agent={members.find((m) => m.id === AGENT_ID)}
          inVoice={channelVoice}
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
    </div>
  )
}
