import { useState } from 'react'
import { TodoSection } from './components/TodoSection'
import { NotesSection } from './components/NotesSection'
import { HistorySection } from './components/HistorySection'
import { DataProvider, useData } from './store'

type Tab = 'todos' | 'notes' | 'history'

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}

function Shell() {
  const [tab, setTab] = useState<Tab>('todos')
  const { trash } = useData()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo &amp; Notes</h1>
        <nav className="tabs" role="tablist" aria-label="Sections">
          <button role="tab" aria-selected={tab === 'todos'} onClick={() => setTab('todos')}>
            Todos
          </button>
          <button role="tab" aria-selected={tab === 'notes'} onClick={() => setTab('notes')}>
            Notes
          </button>
          <button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>
            History{trash.length > 0 && <span className="tab-count"> {trash.length}</span>}
          </button>
        </nav>
      </header>
      <main>
        {tab === 'todos' && <TodoSection />}
        {tab === 'notes' && <NotesSection />}
        {tab === 'history' && <HistorySection />}
      </main>
      <footer className="app-footer">Saved in your browser · nothing leaves this device</footer>
    </div>
  )
}
