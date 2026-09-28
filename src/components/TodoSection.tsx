import { useMemo, useState, type FormEvent } from 'react'
import type { Todo } from '../types'
import { newId } from '../lib/useLocalStorage'
import { dueStatus } from '../lib/dates'
import { useData } from '../store'
import { DueBadge } from './DueBadge'

type Filter = 'all' | 'active' | 'completed' | 'overdue'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
]

/** Incomplete first, then earliest due date (no date last), then newest. */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (a.dueDate !== b.dueDate) {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate < b.dueDate ? -1 : 1
    }
    return b.createdAt - a.createdAt
  })
}

export function TodoSection() {
  const { todos, setTodos, trashTodos } = useData()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(() => {
    const filtered = todos.filter((t) => {
      if (filter === 'active') return !t.completed
      if (filter === 'completed') return t.completed
      if (filter === 'overdue') return !t.completed && dueStatus(t.dueDate) === 'overdue'
      return true
    })
    return sortTodos(filtered)
  }, [todos, filter])

  const remaining = todos.filter((t) => !t.completed).length
  const hasCompleted = todos.some((t) => t.completed)

  function addTodo(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setTodos((prev) => [
      { id: newId(), title: trimmed, completed: false, dueDate: dueDate || null, createdAt: Date.now() },
      ...prev,
    ])
    setTitle('')
    setDueDate('')
  }

  function updateTodo(id: string, patch: Partial<Todo>) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function deleteTodo(id: string) {
    trashTodos([id])
  }

  return (
    <section className="panel" aria-labelledby="todos-heading">
      <header className="panel-header">
        <h2 id="todos-heading">Todos</h2>
        <span className="count" aria-live="polite">
          {remaining} {remaining === 1 ? 'task' : 'tasks'} left
        </span>
      </header>

      <form className="add-form" onSubmit={addTodo}>
        <input
          aria-label="New todo"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          aria-label="Due date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button type="submit" className="btn-primary">Add</button>
      </form>

      <div className="filters" role="group" aria-label="Filter todos">
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
        {hasCompleted && (
          <button
            type="button"
            className="link-btn"
            onClick={() => trashTodos(todos.filter((t) => t.completed).map((t) => t.id))}
          >
            Clear completed
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="empty">{todos.length === 0 ? 'No todos yet. Add one above.' : 'Nothing in this view.'}</p>
      ) : (
        <ul className="list">
          {visible.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onUpdate={updateTodo} onDelete={deleteTodo} />
          ))}
        </ul>
      )}
    </section>
  )
}

function TodoItem({
  todo,
  onUpdate,
  onDelete,
}: {
  todo: Todo
  onUpdate: (id: string, patch: Partial<Todo>) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(todo.title)
  const [draftDue, setDraftDue] = useState(todo.dueDate ?? '')

  function startEdit() {
    setDraftTitle(todo.title)
    setDraftDue(todo.dueDate ?? '')
    setEditing(true)
  }

  function save(e: FormEvent) {
    e.preventDefault()
    const trimmed = draftTitle.trim()
    if (!trimmed) return
    onUpdate(todo.id, { title: trimmed, dueDate: draftDue || null })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="item editing">
        <form className="edit-form" onSubmit={save}>
          <input
            aria-label="Edit todo title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
            autoFocus
          />
          <input
            type="date"
            aria-label="Edit due date"
            value={draftDue}
            onChange={(e) => setDraftDue(e.target.value)}
          />
          <div className="actions">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      </li>
    )
  }

  const status = todo.completed ? 'done' : dueStatus(todo.dueDate)
  return (
    <li className={`item status-${status}${todo.completed ? ' completed' : ''}`}>
      <label className="check">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onUpdate(todo.id, { completed: !todo.completed })}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'not done' : 'done'}`}
        />
        <span className="title">{todo.title}</span>
      </label>
      <DueBadge dueDate={todo.dueDate} completed={todo.completed} />
      <div className="actions">
        <button type="button" onClick={startEdit} aria-label={`Edit "${todo.title}"`}>Edit</button>
        <button type="button" className="danger" onClick={() => onDelete(todo.id)} aria-label={`Delete "${todo.title}"`}>
          Delete
        </button>
      </div>
    </li>
  )
}
