import { describe, expect, it } from 'vitest'
import { daysUntil, dueStatus, formatDue, todayISO } from './dates'

const now = new Date(2026, 8, 28, 15, 30) // 28 Sep 2026, 3:30pm local

describe('dates', () => {
  it('formats today as YYYY-MM-DD', () => {
    expect(todayISO(now)).toBe('2026-09-28')
  })

  it('counts whole days regardless of time of day', () => {
    expect(daysUntil('2026-09-28', now)).toBe(0)
    expect(daysUntil('2026-09-29', now)).toBe(1)
    expect(daysUntil('2026-09-25', now)).toBe(-3)
    expect(daysUntil('2026-10-28', now)).toBe(30)
  })

  it('classifies due status', () => {
    expect(dueStatus(null, now)).toBe('none')
    expect(dueStatus('2026-09-27', now)).toBe('overdue')
    expect(dueStatus('2026-09-28', now)).toBe('today')
    expect(dueStatus('2026-10-01', now)).toBe('soon')
    expect(dueStatus('2026-10-02', now)).toBe('later')
  })

  it('produces human-readable labels', () => {
    expect(formatDue('2026-09-28', now)).toBe('Due today')
    expect(formatDue('2026-09-29', now)).toBe('Due tomorrow')
    expect(formatDue('2026-09-27', now)).toBe('Overdue by 1 day')
    expect(formatDue('2026-09-20', now)).toBe('Overdue by 8 days')
    expect(formatDue('2026-10-02', now)).toBe('Due in 4 days')
    expect(formatDue('2026-12-25', now)).toMatch(/^Due /)
  })
})
