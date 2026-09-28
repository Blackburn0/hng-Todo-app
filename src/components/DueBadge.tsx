import { dueStatus, formatDue } from '../lib/dates'

export function DueBadge({ dueDate, completed }: { dueDate: string | null; completed: boolean }) {
  if (!dueDate) return null
  const status = completed ? 'done' : dueStatus(dueDate)
  return (
    <span className={`badge badge-${status}`} data-testid="due-badge">
      {completed ? `Was due ${dueDate}` : formatDue(dueDate)}
    </span>
  )
}
