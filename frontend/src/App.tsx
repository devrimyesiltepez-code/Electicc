import { useEffect, useMemo, useState } from 'react'
import { api, getPassword, setPassword } from './lib/api'
import type { Customer, Project, Task } from './lib/types'

const PROJECT_STATUSES = [
  'Planlandı',
  'Çizimde',
  'Revizyonda',
  'Onay Bekliyor',
  'Tamamlandı',
]

const TASK_STATUSES = ['ToDo', 'Doing', 'Blocked', 'Done']

const passwordRequired = Boolean(import.meta.env.VITE_APP_PASSWORD)

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('tr-TR')
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
      {value}
    </span>
  )
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPassword(value)
    try {
      await api.getProjects()
      setError('')
      onUnlock()
    } catch (err) {
      setError('Şifre doğrulanamadı. Lütfen tekrar deneyin.')
      setPassword('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg"
      >
        <h1 className="text-2xl font-semibold">Elektrik Proje Paneli</h1>
        <p className="mt-2 text-sm text-slate-400">
          Bu panel sadece yerel kullanım içindir. Şifrenizi girerek devam edin.
        </p>
        <input
          type="password"
          className="mt-6 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="Şifre"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Giriş yap
        </button>
      </form>
    </div>
  )
}

function KanbanColumn({
  title,
  projects,
  onSelect,
}: {
  title: string
  projects: Project[]
  onSelect: (project: Project) => void
}) {
  return (
    <div className="flex min-w-[240px] flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <span className="text-xs text-slate-500">{projects.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <button
            key={project.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-cyan-400"
            onClick={() => onSelect(project)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">{project.name}</p>
                <p className="text-xs text-slate-500">{project.code}</p>
              </div>
              <StatusBadge value={project.priority} />
            </div>
            <p className="mt-3 text-xs text-slate-400">{project.customer.name}</p>
            <p className="mt-2 text-xs text-slate-500">Bitiş: {formatDate(project.due_date)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">{task.title}</p>
          <p className="text-xs text-slate-400">{task.notes || 'Not eklenmedi'}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
          <StatusBadge value={task.status} />
          <span>Bitiş: {formatDate(task.due_date)}</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(!passwordRequired || Boolean(getPassword()))
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      const [projectData, customerData] = await Promise.all([
        api.getProjects(),
        api.getCustomers(),
      ])
      setProjects(projectData as Project[])
      setCustomers(customerData as Customer[])
      setError('')
    } catch (err) {
      setError('Veriler alınamadı. Şifreyi veya servisleri kontrol edin.')
    }
  }

  useEffect(() => {
    if (isUnlocked) {
      void loadData()
    }
  }, [isUnlocked])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.code.toLowerCase().includes(search.toLowerCase()) ||
        project.customer.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter ? project.status === statusFilter : true
      const matchesPriority = priorityFilter ? project.priority === priorityFilter : true
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [projects, search, statusFilter, priorityFilter])

  const projectsByStatus = useMemo(() => {
    return PROJECT_STATUSES.reduce<Record<string, Project[]>>((acc, status) => {
      acc[status] = filteredProjects.filter((project) => project.status === status)
      return acc
    }, {})
  }, [filteredProjects])

  const handleTaskCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedProject) return
    const formData = new FormData(event.currentTarget)
    const payload = {
      title: formData.get('title'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      due_date: formData.get('due_date') || null,
    }
    await api.createTask(selectedProject.id, payload)
    await loadData()
    event.currentTarget.reset()
  }

  const handleFileLinkCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedProject) return
    const formData = new FormData(event.currentTarget)
    const payload = {
      label: formData.get('label'),
      path: formData.get('path'),
    }
    await api.createFileLink(selectedProject.id, payload)
    await loadData()
    event.currentTarget.reset()
  }

  const handleRevisionCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedProject) return
    const formData = new FormData(event.currentTarget)
    const payload = {
      note: formData.get('note'),
    }
    await api.createRevision(selectedProject.id, payload)
    await loadData()
    event.currentTarget.reset()
  }

  if (!isUnlocked && passwordRequired) {
    return <PasswordGate onUnlock={() => setIsUnlocked(true)} />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Elektrik Proje Takip Paneli</h1>
            <p className="text-sm text-slate-400">{customers.length} müşteri / {projects.length} proje</p>
          </div>
          <div className="text-xs text-slate-400">
            {new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-wrap items-center gap-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm"
                placeholder="Proje, kod veya müşteri ara..."
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="">Tüm Durumlar</option>
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="">Tüm Öncelikler</option>
                {['Kritik', 'Yüksek', 'Orta', 'Düşük'].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex gap-6">
              {PROJECT_STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  title={status}
                  projects={projectsByStatus[status] || []}
                  onSelect={(project) => setSelectedProject(project)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {selectedProject ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">{selectedProject.code}</p>
                  <h2 className="text-lg font-semibold">{selectedProject.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{selectedProject.customer.name}</p>
                </div>
                <StatusBadge value={selectedProject.status} />
              </div>
              <p className="mt-4 text-sm text-slate-300">{selectedProject.description || 'Açıklama yok.'}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-400">
                <div>
                  <p>Öncelik</p>
                  <p className="text-sm text-slate-200">{selectedProject.priority}</p>
                </div>
                <div>
                  <p>Termin</p>
                  <p className="text-sm text-slate-200">{formatDate(selectedProject.due_date)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
              Detay görmek için bir proje seçin.
            </div>
          )}

          {selectedProject ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Görevler</h3>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {selectedProject.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
                <form onSubmit={handleTaskCreate} className="mt-5 grid gap-3 text-sm">
                  <input
                    name="title"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                    placeholder="Yeni görev başlığı"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      name="status"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                      defaultValue={TASK_STATUSES[0]}
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <input
                      name="due_date"
                      type="date"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <textarea
                    name="notes"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                    placeholder="Notlar"
                    rows={2}
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
                  >
                    Görev ekle
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-sm font-semibold">Revizyon Notları</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {selectedProject.revisions.map((revision) => (
                    <li key={revision.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                      <p>{revision.note}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(revision.created_at)}</p>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleRevisionCreate} className="mt-4 flex flex-col gap-3">
                  <textarea
                    name="note"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                    placeholder="Yeni revizyon notu"
                    rows={2}
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                  >
                    Not ekle
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-sm font-semibold">Dosya Bağlantıları</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  {selectedProject.file_links.map((link) => (
                    <li key={link.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
                      <div>
                        <p className="font-semibold text-slate-200">{link.label}</p>
                        <p className="text-xs text-slate-500">{link.path}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleFileLinkCreate} className="mt-4 grid gap-3">
                  <input
                    name="label"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                    placeholder="Bağlantı etiketi"
                    required
                  />
                  <input
                    name="path"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                    placeholder="Dosya yolu veya URL"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                  >
                    Bağlantı ekle
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
