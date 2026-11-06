import type { Member } from '../platform'

interface AvatarProps {
  member: Member
  size?: 'message' | 'mini'
  speaking?: boolean
}

export default function Avatar({ member, size = 'message', speaking = false }: AvatarProps) {
  const className = [
    'avatar',
    `avatar--${size}`,
    member.kind === 'agent' ? 'avatar--agent' : '',
    speaking ? 'avatar--speaking' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={className} data-token={member.avatarToken} title={member.name}>
      {member.initials}
    </span>
  )
}
