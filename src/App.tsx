import { useMemo, useState } from 'react'
import { workspace } from './lib/fixtures'
import type { ThreadView } from './platform'
import SpaceRail from './components/SpaceRail'
import Sidebar from './components/Sidebar'
import ChannelPane from './components/ChannelPane'
import ThreadPane from './components/ThreadPane'

const SPACES = [
  { id: 'collab', initials: 'CA' },
  { id: 'decisions', initials: 'DA' },
]

export default function App() {
  const { members, categories, channels } = workspace

  const [activeChannelId, setActiveChannelId] = useState('decision-app')
  const [activeThreadId, setActiveThreadId] = useState<string | null>('thr-thresholds')
  const [threadView, setThreadView] = useState<ThreadView>('split')

  const channel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) ?? channels[0],
    [channels, activeChannelId],
  )

  const thread = useMemo(() => {
    if (!channel || !activeThreadId) return undefined
    return channel.threads.find((t) => t.id === activeThreadId)
  }, [channel, activeThreadId])

  function selectChannel(channelId: string) {
    setActiveChannelId(channelId)
    setActiveThreadId(null)
    setThreadView('closed')
  }

  function selectThread(channelId: string, threadId: string) {
    setActiveChannelId(channelId)
    setActiveThreadId(threadId)
    setThreadView('split')
  }

  if (!channel) return null

  const showThread = Boolean(thread) && threadView !== 'closed'

  return (
    <div className={`shell${threadView === 'full' ? ' shell--thread-full' : ''}`}>
      <SpaceRail spaces={SPACES} activeId="collab" />

      <Sidebar
        categories={categories}
        channels={channels}
        members={members}
        activeChannelId={channel.id}
        activeThreadId={showThread ? activeThreadId : null}
        onSelectChannel={selectChannel}
        onSelectThread={selectThread}
      />

      {threadView === 'full' ? null : (
        <ChannelPane
          channel={channel}
          members={members}
          onOpenThread={(threadId) => selectThread(channel.id, threadId)}
        />
      )}

      {showThread && thread ? (
        <ThreadPane
          channel={channel}
          thread={thread}
          members={members}
          view={threadView}
          onExpand={() => setThreadView('full')}
          onRestore={() => setThreadView('split')}
          onClose={() => {
            setThreadView('closed')
            setActiveThreadId(null)
          }}
        />
      ) : null}
    </div>
  )
}
