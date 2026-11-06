// Seed data. Demo identities — not live accounts, not a claim that real people are online.
// Content names a real-looking Decision App change, a PR thread and an agent tool run.

import type { Category, Channel, Member, Workspace } from './types'

const NOW = new Date('2026-11-06T11:20:00+01:00')

function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString()
}

export const members: Member[] = [
  {
    id: 'bob',
    name: 'Bob',
    kind: 'human',
    role: 'Backend',
    initials: 'BO',
    avatarToken: 1,
    presence: 'online',
  },
  {
    id: 'joe',
    name: 'Joe',
    kind: 'human',
    role: 'Frontend',
    initials: 'JO',
    avatarToken: 2,
    presence: 'online',
  },
  {
    id: 'lena',
    name: 'Lena',
    kind: 'human',
    role: 'Data',
    initials: 'LE',
    avatarToken: 3,
    presence: 'away',
  },
  {
    id: 'forge',
    name: 'Forge',
    kind: 'agent',
    role: 'coding agent',
    initials: 'FG',
    avatarToken: 4,
    presence: 'online',
  },
  {
    id: 'scout',
    name: 'Scout',
    kind: 'agent',
    role: 'research agent',
    initials: 'SC',
    avatarToken: 1,
    presence: 'online',
  },
]

export const categories: Category[] = [
  { id: 'cat-product', name: 'Product', channelIds: ['decision-app', 'agent-platform'] },
  { id: 'cat-general', name: 'General', channelIds: ['general', 'random'] },
]

export const channels: Channel[] = [
  {
    id: 'decision-app',
    name: 'decision-app',
    topic: 'Rules engine and the review surface',
    voiceMemberIds: ['joe'],
    threads: [
      {
        id: 'thr-thresholds',
        parentMessageId: 'm-da-3',
        name: 'team-scoped decisions',
        voiceMemberIds: ['lena'],
        replies: [
          {
            id: 'tr-1',
            authorId: 'lena',
            body: 'Agreed. I can take the threshold table if you want to keep the review surface.',
            sentAt: minutesAgo(96),
            toolCalls: [],
          },
          {
            id: 'tr-2',
            authorId: 'forge',
            body: 'Picking that up. Branch `feat/team-scoped-thresholds` — I will open the PR against `main` once the table compiles.',
            sentAt: minutesAgo(94),
            toolCalls: [],
          },
          {
            id: 'tr-3',
            authorId: 'bob',
            body: 'One thing: keep the fallback at the org default so existing tenants do not move.',
            sentAt: minutesAgo(61),
            toolCalls: [],
          },
        ],
      },
    ],
    messages: [
      {
        id: 'm-da-1',
        authorId: 'bob',
        body: 'Morning. The Decision App review page is still showing the old rule set after a deploy — anyone else seeing that?',
        sentAt: minutesAgo(184),
        toolCalls: [],
      },
      {
        id: 'm-da-2',
        authorId: 'forge',
        body: 'Checking. The deployed image is `v2.14.0` but the rule set bundle is stamped `2026-10-29`.',
        sentAt: minutesAgo(181),
        toolCalls: [
          {
            id: 'tc-1',
            kind: 'Bash',
            summary: 'kubectl get deploy decision-app -o jsonpath={.spec.template.spec.containers[0].image}',
            detail:
              'decision-app:v2.14.0\n\nImage digest sha256:4dbce15a… matches the tag pushed 2026-11-04. The rule bundle is baked into the image at build time, so a stale bundle means the build cache reused an older layer.',
            state: 'success',
            expanded: true,
          },
          {
            id: 'tc-2',
            kind: 'Read',
            summary: 'Dockerfile — rule bundle copy step',
            detail:
              'COPY rules/ /app/rules/\n\nThis step sits after the cache-busting ARG, so it should invalidate. It does not, because `rules/` is not in the build context when the CI job checks out with a sparse filter.',
            state: 'success',
            expanded: false,
          },
        ],
      },
      {
        id: 'm-da-3',
        authorId: 'joe',
        body: 'That is the sparse checkout. I can fix the CI filter today — but the team-scoped decisions question is separate and I would rather not mix the two in one PR.',
        sentAt: minutesAgo(102),
        toolCalls: [],
      },
      {
        id: 'm-da-4',
        authorId: 'lena',
        body: 'Separate PRs, yes. Two things, two reviews.',
        sentAt: minutesAgo(99),
        toolCalls: [],
      },
      {
        id: 'm-da-5',
        authorId: 'forge',
        body: 'CI filter fixed and pushed: `fix/rule-bundle-build-context`. The bundle now rebuilds when `rules/` changes — verified by touching a rule and watching the layer hash change.',
        sentAt: minutesAgo(58),
        toolCalls: [
          {
            id: 'tc-3',
            kind: 'Edit',
            summary: 'ci/build.yml — replace sparse filter with full checkout for the rules path',
            detail:
              '-      sparse-checkout: |\n-        src/\n+      sparse-checkout: |\n+        src/\n+        rules/',
            state: 'success',
            expanded: false,
          },
        ],
      },
      {
        id: 'm-da-6',
        authorId: 'bob',
        body: 'Nice. @joe can you take the review on that one? I am on the tenant migration until Thursday.',
        sentAt: minutesAgo(41),
        toolCalls: [],
      },
    ],
  },
  {
    id: 'agent-platform',
    name: 'agent-platform',
    topic: 'Runtime, sessions and the shared workspace',
    voiceMemberIds: [],
    threads: [],
    messages: [
      {
        id: 'm-ap-1',
        authorId: 'scout',
        body: 'Survey draft is up. Five candidate UIs scored against multi-user live view, agent-agnostic backend and session sharing. Short version: most of them assume a shared backend key, which rules them out for us.',
        sentAt: minutesAgo(320),
        toolCalls: [],
      },
      {
        id: 'm-ap-2',
        authorId: 'lena',
        body: 'That matches what I expected. The per-user-auth constraint is doing a lot of the filtering.',
        sentAt: minutesAgo(300),
        toolCalls: [],
      },
      {
        id: 'm-ap-3',
        authorId: 'forge',
        body: 'Session store is the piece that matters. If transcripts land somewhere readable, the UI becomes a viewer and we stop arguing about protocols.',
        sentAt: minutesAgo(150),
        toolCalls: [],
      },
    ],
  },
  {
    id: 'general',
    name: 'general',
    topic: 'Everything else',
    voiceMemberIds: ['bob', 'scout'],
    threads: [],
    messages: [
      {
        id: 'm-ge-1',
        authorId: 'joe',
        body: 'Standup notes are in the wiki. Nothing blocked.',
        sentAt: minutesAgo(400),
        toolCalls: [],
      },
      {
        id: 'm-ge-2',
        authorId: 'bob',
        body: 'Same. I am out Friday afternoon.',
        sentAt: minutesAgo(390),
        toolCalls: [],
      },
    ],
  },
  {
    id: 'random',
    name: 'random',
    topic: 'Off topic',
    voiceMemberIds: [],
    threads: [],
    messages: [
      {
        id: 'm-ra-1',
        authorId: 'lena',
        body: 'The coffee machine is fixed.',
        sentAt: minutesAgo(700),
        toolCalls: [],
      },
    ],
  },
]

export const workspace: Workspace = { members, categories, channels }

export function memberById(id: string): Member | undefined {
  return members.find((m) => m.id === id)
}
