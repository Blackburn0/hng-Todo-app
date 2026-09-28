import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { DataProvider } from '../store'

export function renderWithData(ui: ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>)
}
