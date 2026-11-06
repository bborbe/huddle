// Web view layer. Structure mirrors the handoff export (screens/desktop-thread-split.html):
// rail | sidebar | channel | thread, as floating panels on --bg-app.
// Seeded content arrives in a later subtask; this is the shell only.

export default function App() {
  return (
    <div className="shell">
      <nav className="rail" aria-label="Spaces">
        <div className="rail-item rail-item--active">CA</div>
        <div className="rail-item">DT</div>
      </nav>

      <aside className="panel sidebar">
        <header className="panel-header">Collaborative AI</header>
        <div className="panel-body">
          <p className="empty">Channels load in a later subtask.</p>
        </div>
      </aside>

      <main className="panel channel">
        <header className="panel-header">
          # channel <span className="muted">no channel selected</span>
        </header>
        <div className="panel-body">
          <p className="empty">Message history loads in a later subtask.</p>
        </div>
      </main>

      <section className="panel thread">
        <header className="panel-header">Thread</header>
        <div className="panel-body">
          <p className="empty">Thread replies load in a later subtask.</p>
        </div>
      </section>
    </div>
  )
}
