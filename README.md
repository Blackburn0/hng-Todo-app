# Todo & Notes

A clean, fast todo and notes app with due dates and a 30-day deleted-items history. Everything is stored locally in your browser — no account, no backend.

**Live demo:** https://blackburn0.github.io/hng-Todo-app/

## Features

### Todos
- Create, edit, complete and delete todos
- Optional **due dates** — set, change or clear them when adding or editing
- Colour-coded status labels: *Overdue*, *Due today*, *Due in N days*, *Due Oct 10*
- Filters: All · Active · Overdue · Completed
- Smart ordering — unfinished first, then soonest due date
- "Clear completed" in one click

### Notes
- Create, edit and delete notes with a title and body
- Search across titles and content
- Most recently edited notes first

### History (deleted items)
- Deleting a todo or note moves it to **History** instead of erasing it
- **Restore** puts it back exactly as it was, or **Delete forever** removes it
- Items are **permanently deleted automatically after 30 days**, with a countdown shown on each item
- Filter by Todos or Notes; "Empty history" clears everything (with confirmation)

## Tech stack

- [React 19](https://react.dev) + TypeScript
- [Vite](https://vite.dev) for dev server and builds
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) for tests
- `localStorage` for persistence
- Hosted on GitHub Pages via [`gh-pages`](https://github.com/tschaub/gh-pages)

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Test, build and publish `dist/` to GitHub Pages |

## Project structure

```
src/
├── App.tsx                  # Tabs + layout
├── store.tsx                # Shared data provider: todos, notes, history, 30-day purge
├── types.ts                 # Todo and Note types
├── index.css                # Styles
├── lib/
│   ├── dates.ts             # Due-date maths and labels
│   └── useLocalStorage.ts   # Persisted state hook
└── components/
    ├── TodoSection.tsx
    ├── NotesSection.tsx
    ├── HistorySection.tsx
    └── DueBadge.tsx
```

## Deployment

The site is served from the `gh-pages` branch. To publish a new version:

```bash
npm run deploy
```

This runs the tests, builds the app and pushes `dist/` to `gh-pages`. GitHub Pages picks it up within a minute or two.

## Data & privacy

All data lives in your browser's `localStorage` under the keys `todos`, `notes` and `trash`. Nothing is sent to a server. Clearing your browser's site data will erase it. The 30-day cleanup runs whenever the app is open (on load and hourly).
