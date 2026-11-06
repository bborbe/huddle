interface SpaceRailProps {
  spaces: { id: string; initials: string }[]
  activeId: string
}

export default function SpaceRail({ spaces, activeId }: SpaceRailProps) {
  return (
    <nav className="rail" aria-label="Spaces">
      {spaces.map((space) => (
        <div
          key={space.id}
          className={`rail-item${space.id === activeId ? ' rail-item--active' : ''}`}
          aria-current={space.id === activeId ? 'true' : undefined}
        >
          {space.initials}
        </div>
      ))}
    </nav>
  )
}
