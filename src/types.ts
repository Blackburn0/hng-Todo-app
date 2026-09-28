export interface Todo {
  id: string
  title: string
  completed: boolean
  /** ISO date string (YYYY-MM-DD) or null when no due date is set */
  dueDate: string | null
  createdAt: number
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}
