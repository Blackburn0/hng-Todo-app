import { useMemo, useState } from 'react'
import { RETENTION_DAYS, daysLeft, useData, type TrashEntry } from '../store'

type Filter = 'all' | 'todo' | 'note'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'Todos' },
  { key: 'note', label: 'Notes' },
]

function entryTitle(entry: TrashEntry): string {
  return entry.item.title
}

export function HistorySection() {
  const { trash, restore, deleteForever, emptyTrash } = useData()
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(
    () =>
      trash
        .filter((e) => filter === 'all' || e.kind === filter)
        .sort((a, b) => b.deletedAt - a.deletedAt),
    [trash, filter],
  )

  function handleEmpty() {
    if (window.confirm(`Permanently delete all ${trash.length} items in history? This can't be undone.`)) {
      emptyTrash()
    }
  }

  return (
    <section className="panel" aria-labelledby="history-heading">
      <header className="panel-header">
        <h2 id="history-heading">History</h2>
        <span className="count">
          {trash.length} deleted {trash.length === 1 ? 'item' : 'items'}
        </span>
      </header>
      <p className="hint">
        Deleted todos and notes stay here for {RETENTION_DAYS} days, then they're permanently deleted.
      </p>

      <div className="filters" role="group" aria-label="Filter history">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={filter === f.key ? 'chip active' : 'chip'}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        {trash.length > 0 && (
          <button type="button" className="link-btn danger" onClick={handleEmpty}>
            Empty history
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="empty">{trash.length === 0 ? 'Nothing deleted yet.' : 'Nothing in this view.'}</p>
      ) : (
        <ul className="list">
          {visible.map((entry) => {
            const title = entryTitle(entry)
            const left = daysLeft(entry.deletedAt)
            return (
              <li key={entry.id} className="item history-item">
                <span className={`kind kind-${entry.kind}`}>{entry.kind === 'todo' ? 'Todo' : 'Note'}</span>
                <div className="history-main">
                  <span className="title">{title}</span>
                  <span className="meta">
                    Deleted {new Date(entry.deletedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} ·{' '}
                    <span className={left <= 3 ? 'expiring' : undefined}>
                      {left <= 1 ? 'deleted permanently within a day' : `deleted permanently in ${left} days`}
                    </span>
                  </span>
                </div>
                <div className="actions">
                  <button type="button" onClick={() => restore(entry.id)} aria-label={`Restore "${title}"`}>
                    Restore
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteForever(entry.id)}
                    aria-label={`Delete "${title}" forever`}
                  >
                    Delete forever
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
