import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

it('switches between Todos and Notes tabs', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Todos' })).toBeInTheDocument()

  await user.click(screen.getByRole('tab', { name: 'Notes' }))
  expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Todos' })).not.toBeInTheDocument()
})
