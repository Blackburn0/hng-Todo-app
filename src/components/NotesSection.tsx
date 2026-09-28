import { useMemo, useState, type FormEvent } from 'react'
import type { Note } from '../types'
import { newId } from '../lib/useLocalStorage'
import { useData } from '../store'

export function NotesSection() {
  const { notes, setNotes, trashNote } = useData()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      : notes
    return [...filtered].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, query])

  function addNote(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return
    const now = Date.now()
    setNotes((prev) => [
      { id: newId(), title: title.trim() || 'Untitled', content: content.trim(), createdAt: now, updatedAt: now },
      ...prev,
    ])
    setTitle('')
    setContent('')
  }

  function updateNote(id: string, patch: Pick<Note, 'title' | 'content'>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)))
  }

  function deleteNote(id: string) {
    trashNote(id)
  }

  return (
    <section className="panel" aria-labelledby="notes-heading">
      <header className="panel-header">
        <h2 id="notes-heading">Notes</h2>
        <span className="count">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </header>

      <form className="note-form" onSubmit={addNote}>
        <input aria-label="Note title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          aria-label="Note content"
          placeholder="Write a note…"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit" className="btn-primary">Add note</button>
      </form>

      {notes.length > 0 && (
        <input
          className="search"
          type="search"
          aria-label="Search notes"
          placeholder="Search notes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {visible.length === 0 ? (
        <p className="empty">{notes.length === 0 ? 'No notes yet.' : 'No notes match your search.'}</p>
      ) : (
        <ul className="notes-grid">
          {visible.map((note) => (
            <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
          ))}
        </ul>
      )}
    </section>
  )
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note
  onUpdate: (id: string, patch: Pick<Note, 'title' | 'content'>) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(note.title)
  const [draftContent, setDraftContent] = useState(note.content)

  function startEdit() {
    setDraftTitle(note.title)
    setDraftContent(note.content)
    setEditing(true)
  }

  function save(e: FormEvent) {
    e.preventDefault()
    onUpdate(note.id, { title: draftTitle.trim() || 'Untitled', content: draftContent.trim() })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="note editing">
        <form onSubmit={save} className="note-form">
          <input aria-label="Edit note title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} autoFocus />
          <textarea
            aria-label="Edit note content"
            rows={4}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
          />
          <div className="actions">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="note">
      <h3>{note.title}</h3>
      {note.content && <p className="note-body">{note.content}</p>}
      <footer>
        <time dateTime={new Date(note.updatedAt).toISOString()}>
          {new Date(note.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
        <div className="actions">
          <button type="button" onClick={startEdit} aria-label={`Edit note "${note.title}"`}>Edit</button>
          <button type="button" className="danger" onClick={() => onDelete(note.id)} aria-label={`Delete note "${note.title}"`}>
            Delete
          </button>
        </div>
      </footer>
    </li>
  )
}
