import { useEffect, useRef, useState } from 'react'
import type { Message, ToolCall } from '../platform'
import Avatar from './Avatar'
import type { Member } from '../platform'

const SCRIPT =
  'Rebuilt the rule bundle on top of the CI fix and re-ran the review page. The stale-rule symptom is gone — the bundle now carries the 2026-11-06 stamp and the review surface picks it up on first load.'

const TOKENS = SCRIPT.split(' ')

interface SimulatedReplyProps {
  agent: Member
  runId: number
  onCommit: (message: Message) => void
}

type Phase = 'typing' | 'streaming' | 'tool-running' | 'tool-done' | 'finished'

export default function SimulatedReply({ agent, runId, onCommit }: SimulatedReplyProps) {
  const [phase, setPhase] = useState<Phase>('typing')
  const [shown, setShown] = useState('')
  const committed = useRef(false)

  useEffect(() => {
    setPhase('typing')
    setShown('')
    committed.current = false

    let token = 0
    const timers: number[] = []

    timers.push(
      window.setTimeout(() => {
        setPhase('streaming')
        const tick = window.setInterval(() => {
          token += 1
          setShown(TOKENS.slice(0, token).join(' '))
          if (token >= TOKENS.length) {
            window.clearInterval(tick)
            timers.push(
              window.setTimeout(() => {
                setPhase('tool-running')
                timers.push(
                  window.setTimeout(() => {
                    setPhase('tool-done')
                    timers.push(window.setTimeout(() => setPhase('finished'), 500))
                  }, 1400),
                )
              }, 400),
            )
          }
        }, 55)
        timers.push(tick)
      }, 900),
    )

    return () => {
      timers.forEach((t) => {
        window.clearTimeout(t)
        window.clearInterval(t)
      })
    }
  }, [runId])

  useEffect(() => {
    if (phase !== 'finished' || committed.current) return
    committed.current = true

    const toolCall: ToolCall = {
      id: `tc-sim-${runId}`,
      kind: 'Bash',
      summary: 'npm run build && kubectl rollout status deploy/decision-app',
      detail:
        'Build succeeded in 8.4s.\nwaiting for deployment "decision-app" rollout to finish: 1 of 2 updated replicas are available...\ndeployment "decision-app" successfully rolled out',
      state: 'success',
      expanded: false,
    }

    onCommit({
      id: `m-sim-${runId}`,
      authorId: agent.id,
      body: SCRIPT,
      sentAt: new Date().toISOString(),
      toolCalls: [toolCall],
    })
  }, [phase, runId, agent.id, onCommit])

  if (phase === 'finished') return null

  const streaming = phase === 'streaming'
  const toolVisible = phase === 'tool-running' || phase === 'tool-done'

  return (
    <article className="msg msg--simulated">
      <Avatar member={agent} />
      <div className="msg-main">
        <div className="msg-meta">
          <span className="msg-name">{agent.name}</span>
          <span className="msg-app">app</span>
          <span className="msg-time">now</span>
        </div>

        {phase === 'typing' ? (
          <div className="typing" aria-label="Agent is typing">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <p className="msg-body">
            {shown}
            {streaming ? <span className="caret" aria-hidden="true" /> : null}
          </p>
        )}

        {toolVisible ? (
          <div className="tool-list">
            <div className={`tool tool--${phase === 'tool-running' ? 'running' : 'success'}`}>
              <div className="tool-head tool-head--static">
                <span
                  className={`tool-dot tool-dot--${phase === 'tool-running' ? 'running' : 'success'}`}
                  aria-hidden="true"
                />
                <span className="tool-kind">Bash</span>
                <span className="tool-summary">
                  npm run build &amp;&amp; kubectl rollout status deploy/decision-app
                </span>
                <span className="tool-state">
                  {phase === 'tool-running' ? 'running' : 'success'}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
