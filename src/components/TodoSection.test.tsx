import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithData as render } from '../test/render'
import userEvent from '@testing-library/user-event'
import { TodoSection, sortTodos } from './TodoSection'
import { todayISO } from '../lib/dates'
import type { Todo } from '../types'

function isoOffset(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

async function addTodo(user: ReturnType<typeof userEvent.setup>, title: string, due?: string) {
  await user.type(screen.getByLabelText('New todo'), title)
  if (due) await user.type(screen.getByLabelText('Due date'), due)
  await user.click(screen.getByRole('button', { name: 'Add' }))
}

describe('TodoSection', () => {
  it('creates a todo and persists it to localStorage', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Buy milk')

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('1 task left')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('todos')!)[0].title).toBe('Buy milk')
  })

  it('ignores blank titles', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, '   ')
    expect(screen.getByText('No todos yet. Add one above.')).toBeInTheDocument()
  })

  it('creates a todo with a due date and shows a badge', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Pay rent', isoOffset(0))
    expect(screen.getByTestId('due-badge')).toHaveTextContent('Due today')
  })

  it('reads existing todos from localStorage', () => {
    const stored: Todo[] = [{ id: '1', title: 'Saved task', completed: false, dueDate: null, createdAt: 1 }]
    localStorage.setItem('todos', JSON.stringify(stored))
    render(<TodoSection />)
    expect(screen.getByText('Saved task')).toBeInTheDocument()
  })

  it('toggles completion', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Walk dog')
    await user.click(screen.getByRole('checkbox', { name: /walk dog/i }))

    expect(screen.getByRole('checkbox', { name: /walk dog/i })).toBeChecked()
    expect(screen.getByText('0 tasks left')).toBeInTheDocument()
  })

  it('edits the title and due date', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Draft report')

    await user.click(screen.getByRole('button', { name: 'Edit "Draft report"' }))
    const titleInput = screen.getByLabelText('Edit todo title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Final report')
    await user.type(screen.getByLabelText('Edit due date'), isoOffset(1))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.queryByText('Draft report')).not.toBeInTheDocument()
    expect(screen.getByText('Final report')).toBeInTheDocument()
    expect(screen.getByTestId('due-badge')).toHaveTextContent('Due tomorrow')
  })

  it('removes a due date when cleared during edit', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Call mum', isoOffset(2))

    await user.click(screen.getByRole('button', { name: 'Edit "Call mum"' }))
    await user.clear(screen.getByLabelText('Edit due date'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.queryByTestId('due-badge')).not.toBeInTheDocument()
  })

  it('cancels an edit without saving', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Original')

    await user.click(screen.getByRole('button', { name: 'Edit "Original"' }))
    await user.type(screen.getByLabelText('Edit todo title'), ' changed')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Original')).toBeInTheDocument()
  })

  it('deletes a todo', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Temp')
    await user.click(screen.getByRole('button', { name: 'Delete "Temp"' }))

    expect(screen.queryByText('Temp')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('todos')!)).toEqual([])
  })

  it('filters by active, completed and overdue, and clears completed', async () => {
    const user = userEvent.setup()
    render(<TodoSection />)
    await addTodo(user, 'Late one', isoOffset(-2))
    await addTodo(user, 'Done one')
    await addTodo(user, 'Open one')
    await user.click(screen.getByRole('checkbox', { name: /done one/i }))

    await user.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.queryByText('Done one')).not.toBeInTheDocument()
    expect(screen.getByText('Open one')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Completed' }))
    expect(screen.getByText('Done one')).toBeInTheDocument()
    expect(screen.queryByText('Open one')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Overdue' }))
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByText('Late one')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.click(screen.getByRole('button', { name: 'Clear completed' }))
    expect(screen.queryByText('Done one')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

describe('sortTodos', () => {
  it('puts incomplete first, then earliest due date, undated last', () => {
    const base = { completed: false, createdAt: 0 }
    const todos: Todo[] = [
      { ...base, id: 'a', title: 'no date', dueDate: null },
      { ...base, id: 'b', title: 'done', dueDate: '2026-01-01', completed: true },
      { ...base, id: 'c', title: 'later', dueDate: '2026-12-01' },
      { ...base, id: 'd', title: 'sooner', dueDate: '2026-10-01' },
    ]
    expect(sortTodos(todos).map((t) => t.id)).toEqual(['d', 'c', 'a', 'b'])
  })
})
