export type Customer = {
  id: number
  name: string
  contact?: string | null
}

export type Task = {
  id: number
  title: string
  status: string
  notes?: string | null
  due_date?: string | null
}

export type FileLink = {
  id: number
  label: string
  path: string
}

export type RevisionNote = {
  id: number
  note: string
  created_at: string
}

export type Project = {
  id: number
  customer_id: number
  name: string
  code: string
  status: string
  due_date?: string | null
  priority: string
  description?: string | null
  customer: Customer
  tasks: Task[]
  file_links: FileLink[]
  revisions: RevisionNote[]
}
