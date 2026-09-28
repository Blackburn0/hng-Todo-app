import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import type { Note, Todo } from './types'
import { useLocalStorage } from './lib/useLocalStorage'

export const RETENTION_DAYS = 30
const DAY_MS = 86_400_000
const RETENTION_MS = RETENTION_DAYS * DAY_MS
const PURGE_INTERVAL_MS = 60 * 60 * 1000

export type TrashEntry =
  | { id: string; kind: 'todo'; item: Todo; deletedAt: number }
  | { id: string; kind: 'note'; item: Note; deletedAt: number }

/** Drop entries that have been in history for 30 days or more. */
export function purgeExpired(trash: TrashEntry[], now: number = Date.now()): TrashEntry[] {
  return trash.filter((e) => now - e.deletedAt < RETENTION_MS)
}

/** Days remaining before an entry is permanently deleted (rounded up). */
export function daysLeft(deletedAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((deletedAt + RETENTION_MS - now) / DAY_MS))
}

interface DataContextValue {
  todos: Todo[]
  setTodos: (update: (prev: Todo[]) => Todo[]) => void
  notes: Note[]
  setNotes: (update: (prev: Note[]) => Note[]) => void
  trash: TrashEntry[]
  trashTodos: (ids: string[]) => void
  trashNote: (id: string) => void
  restore: (id: string) => void
  deleteForever: (id: string) => void
  emptyTrash: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', [])
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', [])
  const [rawTrash, setTrash] = useLocalStorage<TrashEntry[]>('trash', [])

  // Purge on load, then hourly for tabs left open. The filtered view below
  // hides anything that expires between runs.
  useEffect(() => {
    const run = () =>
      setTrash((prev) => {
        const kept = purgeExpired(prev)
        return kept.length === prev.length ? prev : kept
      })
    run()
    const timer = setInterval(run, PURGE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [setTrash])

  const trash = useMemo(() => purgeExpired(rawTrash), [rawTrash])

  const trashTodos = useCallback(
    (ids: string[]) => {
      const now = Date.now()
      const removed = todos.filter((t) => ids.includes(t.id))
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)))
      setTrash((prev) => [
        ...removed.map((item): TrashEntry => ({ id: item.id, kind: 'todo', item, deletedAt: now })),
        ...prev,
      ])
    },
    [todos, setTodos, setTrash],
  )

  const trashNote = useCallback(
    (id: string) => {
      const item = notes.find((n) => n.id === id)
      if (!item) return
      setNotes((prev) => prev.filter((n) => n.id !== id))
      setTrash((prev) => [{ id, kind: 'note', item, deletedAt: Date.now() }, ...prev])
    },
    [notes, setNotes, setTrash],
  )

  const restore = useCallback(
    (id: string) => {
      const entry = rawTrash.find((e) => e.id === id)
      if (!entry) return
      if (entry.kind === 'todo') {
        setTodos((prev) => (prev.some((t) => t.id === id) ? prev : [entry.item, ...prev]))
      } else {
        setNotes((prev) => (prev.some((n) => n.id === id) ? prev : [entry.item, ...prev]))
      }
      setTrash((prev) => prev.filter((e) => e.id !== id))
    },
    [rawTrash, setTodos, setNotes, setTrash],
  )

  const deleteForever = useCallback(
    (id: string) => setTrash((prev) => prev.filter((e) => e.id !== id)),
    [setTrash],
  )

  const emptyTrash = useCallback(() => setTrash(() => []), [setTrash])

  const value = useMemo(
    () => ({ todos, setTodos, notes, setNotes, trash, trashTodos, trashNote, restore, deleteForever, emptyTrash }),
    [todos, setTodos, notes, setNotes, trash, trashTodos, trashNote, restore, deleteForever, emptyTrash],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
