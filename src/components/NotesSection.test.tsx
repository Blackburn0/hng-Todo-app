import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithData as render } from '../test/render'
import userEvent from '@testing-library/user-event'
import { NotesSection } from './NotesSection'

async function addNote(user: ReturnType<typeof userEvent.setup>, title: string, content: string) {
  if (title) await user.type(screen.getByLabelText('Note title'), title)
  if (content) await user.type(screen.getByLabelText('Note content'), content)
  await user.click(screen.getByRole('button', { name: 'Add note' }))
}

describe('NotesSection', () => {
  it('creates a note and persists it', async () => {
    const user = userEvent.setup()
    render(<NotesSection />)
    await addNote(user, 'Groceries', 'Eggs, bread')

    expect(screen.getByRole('heading', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.getByText('Eggs, bread')).toBeInTheDocument()
    expect(screen.getByText('1 note')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('notes')!)[0].content).toBe('Eggs, bread')
  })

  it('defaults the title to Untitled and ignores empty notes', async () => {
    const user = userEvent.setup()
    render(<NotesSection />)
    await addNote(user, '', '')
    expect(screen.getByText('No notes yet.')).toBeInTheDocument()

    await addNote(user, '', 'Just a body')
    expect(screen.getByRole('heading', { name: 'Untitled' })).toBeInTheDocument()
  })

  it('edits a note', async () => {
    const user = userEvent.setup()
    render(<NotesSection />)
    await addNote(user, 'Idea', 'first draft')

    await user.click(screen.getByRole('button', { name: 'Edit note "Idea"' }))
    const body = screen.getByLabelText('Edit note content')
    await user.clear(body)
    await user.type(body, 'second draft')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.queryByText('first draft')).not.toBeInTheDocument()
    expect(screen.getByText('second draft')).toBeInTheDocument()
  })

  it('deletes a note', async () => {
    const user = userEvent.setup()
    render(<NotesSection />)
    await addNote(user, 'Scratch', 'bin me')
    await user.click(screen.getByRole('button', { name: 'Delete note "Scratch"' }))

    expect(screen.getByText('No notes yet.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('notes')!)).toEqual([])
  })

  it('searches notes by title and content', async () => {
    const user = userEvent.setup()
    render(<NotesSection />)
    await addNote(user, 'Recipes', 'pasta')
    await addNote(user, 'Books', 'Dune')

    await user.type(screen.getByLabelText('Search notes'), 'dune')
    expect(screen.getByRole('heading', { name: 'Books' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Recipes' })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search notes'))
    await user.type(screen.getByLabelText('Search notes'), 'zzz')
    expect(screen.getByText('No notes match your search.')).toBeInTheDocument()
  })
})
