export type DueStatus = 'overdue' | 'today' | 'soon' | 'later' | 'none'

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Whole days from today until the due date (negative = past). */
export function daysUntil(dueDate: string, now: Date = new Date()): number {
  const [y, m, d] = dueDate.split('-').map(Number)
  const due = Date.UTC(y, m - 1, d)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((due - today) / 86_400_000)
}

export function dueStatus(dueDate: string | null, now: Date = new Date()): DueStatus {
  if (!dueDate) return 'none'
  const days = daysUntil(dueDate, now)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 3) return 'soon'
  return 'later'
}

export function formatDue(dueDate: string, now: Date = new Date()): string {
  const days = daysUntil(dueDate, now)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days === -1) return 'Overdue by 1 day'
  if (days < 0) return `Overdue by ${-days} days`
  if (days <= 6) return `Due in ${days} days`
  const [y, m, d] = dueDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `Due ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: y === now.getFullYear() ? undefined : 'numeric',
  })}`
}
