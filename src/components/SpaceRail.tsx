interface SpaceRailProps {
  spaces: { id: string; name: string; initials: string }[]
  activeId: string
  onSelectSpace: (spaceId: string) => void
}

export default function SpaceRail({ spaces, activeId, onSelectSpace }: SpaceRailProps) {
  return (
    <nav className="rail" aria-label="Spaces">
      {spaces.map((space) => (
        <button
          key={space.id}
          type="button"
          className={`rail-item${space.id === activeId ? ' rail-item--active' : ''}`}
          aria-current={space.id === activeId ? 'true' : undefined}
          aria-label={`Switch to ${space.name}`}
          title={space.name}
          onClick={() => onSelectSpace(space.id)}
        >
          {space.initials}
        </button>
      ))}
    </nav>
  )
}
