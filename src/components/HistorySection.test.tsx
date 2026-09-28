import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { daysLeft, purgeExpired, type TrashEntry } from '../store'
import type { Note, Todo } from '../types'

const DAY = 86_400_000

function todoEntry(id: string, title: string, deletedAt: number): TrashEntry {
  const item: Todo = { id, title, completed: false, dueDate: null, createdAt: 0 }
  return { id, kind: 'todo', item, deletedAt }
}

function noteEntry(id: string, title: string, deletedAt: number): TrashEntry {
  const item: Note = { id, title, content: 'body', createdAt: 0, updatedAt: 0 }
  return { id, kind: 'note', item, deletedAt }
}

const stored = (key: string) => JSON.parse(localStorage.getItem(key) ?? '[]')

describe('retention helpers', () => {
  const now = Date.UTC(2026, 8, 28)

  it('keeps entries younger than 30 days and drops the rest', () => {
    const trash = [
      todoEntry('fresh', 'fresh', now - 1 * DAY),
      todoEntry('edge', 'edge', now - 29.9 * DAY),
      todoEntry('expired', 'expired', now - 30 * DAY),
      noteEntry('old', 'old', now - 45 * DAY),
    ]
    expect(purgeExpired(trash, now).map((e) => e.id)).toEqual(['fresh', 'edge'])
  })

  it('counts days left until permanent deletion', () => {
    expect(daysLeft(now, now)).toBe(30)
    expect(daysLeft(now - 10 * DAY, now)).toBe(20)
    expect(daysLeft(now - 29.5 * DAY, now)).toBe(1)
    expect(daysLeft(now - 40 * DAY, now)).toBe(0)
  })
})

describe('History', () => {
  it('moves a deleted todo to history and restores it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('New todo'), 'Oops')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: 'Delete "Oops"' }))

    expect(stored('todos')).toEqual([])
    expect(stored('trash')[0]).toMatchObject({ kind: 'todo', item: { title: 'Oops' } })

    await user.click(screen.getByRole('tab', { name: /History/ }))
    expect(screen.getByText('Oops')).toBeInTheDocument()
    expect(screen.getByText('deleted permanently in 30 days')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restore "Oops"' }))
    expect(screen.getByText('Nothing deleted yet.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Todos' }))
    expect(screen.getByText('Oops')).toBeInTheDocument()
    expect(stored('trash')).toEqual([])
  })

  it('moves deleted notes to history and restores them to Notes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Notes' }))
    await user.type(screen.getByLabelText('Note title'), 'Keep me')
    await user.click(screen.getByRole('button', { name: 'Add note' }))
    await user.click(screen.getByRole('button', { name: 'Delete note "Keep me"' }))

    await user.click(screen.getByRole('tab', { name: /History/ }))
    await user.click(screen.getByRole('button', { name: 'Restore "Keep me"' }))
    await user.click(screen.getByRole('tab', { name: 'Notes' }))
    expect(screen.getByRole('heading', { name: 'Keep me' })).toBeInTheDocument()
  })

  it('sends "Clear completed" todos to history', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('New todo'), 'Finished')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('checkbox', { name: /finished/i }))
    await user.click(screen.getByRole('button', { name: 'Clear completed' }))

    await user.click(screen.getByRole('tab', { name: /History/ }))
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })

  it('deletes a single item forever', async () => {
    localStorage.setItem('trash', JSON.stringify([todoEntry('a', 'Gone', Date.now()), noteEntry('b', 'Stays', Date.now())]))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: /History/ }))
    await user.click(screen.getByRole('button', { name: 'Delete "Gone" forever' }))

    expect(screen.queryByText('Gone')).not.toBeInTheDocument()
    expect(screen.getByText('Stays')).toBeInTheDocument()
    expect(stored('trash').map((e: TrashEntry) => e.id)).toEqual(['b'])
  })

  it('empties history only after confirmation', async () => {
    localStorage.setItem('trash', JSON.stringify([todoEntry('a', 'One', Date.now()), noteEntry('b', 'Two', Date.now())]))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: /History/ }))

    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await user.click(screen.getByRole('button', { name: 'Empty history' }))
    expect(screen.getByText('One')).toBeInTheDocument()

    confirm.mockReturnValueOnce(true)
    await user.click(screen.getByRole('button', { name: 'Empty history' }))
    expect(screen.getByText('Nothing deleted yet.')).toBeInTheDocument()
    expect(stored('trash')).toEqual([])
    confirm.mockRestore()
  })

  it('filters history by type', async () => {
    localStorage.setItem('trash', JSON.stringify([todoEntry('a', 'A todo', Date.now()), noteEntry('b', 'A note', Date.now())]))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: /History/ }))

    const filters = screen.getByRole('group', { name: 'Filter history' })
    await user.click(within(filters).getByRole('button', { name: 'Notes' }))
    expect(screen.getByText('A note')).toBeInTheDocument()
    expect(screen.queryByText('A todo')).not.toBeInTheDocument()
  })

  it('permanently removes items older than 30 days on load', () => {
    localStorage.setItem(
      'trash',
      JSON.stringify([todoEntry('old', 'Ancient', Date.now() - 31 * DAY), todoEntry('new', 'Recent', Date.now() - 2 * DAY)]),
    )
    render(<App />)
    expect(stored('trash').map((e: TrashEntry) => e.id)).toEqual(['new'])
    expect(screen.getByRole('tab', { name: /History/ })).toHaveTextContent('History 1')
  })

  it('purges items that expire while the app stays open', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    try {
      localStorage.setItem('trash', JSON.stringify([todoEntry('x', 'Soon gone', Date.now() - 29.99 * DAY)]))
      render(<App />)
      expect(stored('trash')).toHaveLength(1)

      act(() => vi.advanceTimersByTime(60 * 60 * 1000))
      expect(stored('trash')).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })
})
