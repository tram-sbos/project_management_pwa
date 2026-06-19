import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Cloud,
  CloudOff,
  Edit3,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { api, isLiveApi } from './services/api'
import type {
  ActivityItem,
  DashboardStats,
  MailSettings,
  Milestone,
  Project,
  SectionKey,
  SubModule,
  TaskComment,
  TaskItem,
  TeamMember,
  WorkModule,
} from './types'

const sections: Array<{ key: SectionKey; label: string; icon: typeof Gauge }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'milestones', label: 'Milestones', icon: CalendarDays },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const projectStatuses = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled',
]

const taskStatuses = ['Pending', 'In Progress', 'Review', 'Done']
const milestoneStatuses = ['Pending', 'In Progress', 'Completed', 'Delayed']
const projectHealth = ['On Track', 'At Risk', 'Delayed']
const priorities = ['Low', 'Medium', 'High', 'Critical']
const memberStatuses = ['Active', 'On Leave', 'Inactive']
const buildVersion = import.meta.env.VITE_APP_VERSION || '2026-06-17.1'
const themeStorageKey = 'project-management-theme'

type AppTheme = 'classic' | 'premium-dark'

const defaultMailSettings: MailSettings = {
  id: 'DEFAULT',
  name: 'Daily Summary',
  enabled: false,
  interval: 'daily',
  sendTime: '08:00',
  recipients: [],
  reportType: 'summary',
  lastSentAt: '',
  nextRunAt: '',
}

type DashboardFilter = {
  section: SectionKey
  title: string
  projectId?: string
  projectStatus?: string
  projectDerivedStatus?: 'Open' | 'Active' | 'Completed'
  projectHealth?: string
  projectDueWithinDays?: number
  taskStatus?: string
  openTasks?: boolean
  overdueTasks?: boolean
  taskDueWithinDays?: number
  assignee?: string
  openMilestones?: boolean
}

function App() {
  const [activeSection, setActiveSection] = useState<SectionKey>('dashboard')
  const [theme, setThemeState] = useState<AppTheme>(() =>
    window.localStorage.getItem(themeStorageKey) === 'premium-dark' ? 'premium-dark' : 'classic',
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [modules, setModules] = useState<WorkModule[]>([])
  const [subModules, setSubModules] = useState<SubModule[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [comments, setComments] = useState<TaskComment[]>([])
  const [mailSettings, setMailSettings] = useState<MailSettings[]>([defaultMailSettings])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [projectModal, setProjectModal] = useState<Project | 'new' | null>(null)
  const [taskModal, setTaskModal] = useState<TaskItem | 'new' | null>(null)
  const [teamModal, setTeamModal] = useState<TeamMember | 'new' | null>(null)
  const [milestoneModal, setMilestoneModal] = useState<Milestone | 'new' | null>(null)
  const [moduleModal, setModuleModal] = useState<{ projectId: string; module?: WorkModule } | null>(null)
  const [subModuleModal, setSubModuleModal] = useState<{ projectId: string; moduleId: string; submodule?: SubModule } | null>(null)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [drilldown, setDrilldown] = useState<{ title: string; rows: string[] } | null>(null)
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter | null>(null)
  const [notice, setNotice] = useState('')
  const [didLoad, setDidLoad] = useState(false)

  const live = isLiveApi()

  function setTheme(nextTheme: AppTheme) {
    setThemeState(nextTheme)
    window.localStorage.setItem(themeStorageKey, nextTheme)
  }

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [
        projectRows,
        taskRows,
        teamRows,
        milestoneRows,
        moduleRows,
        subModuleRows,
        activityRows,
        commentRows,
        mailRows,
      ] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getTeam(),
        api.getMilestones(),
        api.getModules(),
        api.getSubModules(),
        api.getActivity(),
        api.getComments(),
        api.getMailSettings(),
      ])
      setProjects(projectRows)
      setTasks(taskRows)
      setTeam(teamRows)
      setMilestones(milestoneRows)
      setModules(moduleRows)
      setSubModules(subModuleRows)
      setActivity(activityRows)
      setComments(commentRows)
      setMailSettings(mailRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data')
    } finally {
      setLoading(false)
    }
  }

  if (!didLoad) {
    setDidLoad(true)
    loadData()
  }

  const stats = useMemo(
    () => buildStats(projects, modules, subModules, tasks),
    [projects, modules, subModules, tasks],
  )

  const filteredProjects = useMemo(() => {
    const value = query.trim().toLowerCase()
    return projects.filter((project) => {
      if (dashboardFilter?.section === 'projects') {
        if (dashboardFilter.projectId && project.id !== dashboardFilter.projectId) return false
        if (dashboardFilter.projectDerivedStatus) {
          const derivedStatus = getProjectDerivedStatus(project, modules, subModules, tasks)
          if (derivedStatus !== dashboardFilter.projectDerivedStatus) return false
        }
        if (dashboardFilter.projectStatus && project.status !== dashboardFilter.projectStatus) return false
        if (
          dashboardFilter.projectHealth &&
          deriveProjectHealth(project, modules, subModules, tasks) !== dashboardFilter.projectHealth
        ) return false
        if (dashboardFilter.projectDueWithinDays !== undefined) {
          const remaining = daysUntil(project.endDate)
          if (remaining < 0 || remaining > dashboardFilter.projectDueWithinDays) return false
        }
      }
      if (!value) return true
      return [project.name, project.managerName, project.description, project.status]
        .join(' ')
        .toLowerCase()
        .includes(value)
    })
  }, [projects, modules, subModules, tasks, query, dashboardFilter])

  const filteredTasks = useMemo(() => {
    const value = query.trim().toLowerCase()
    return tasks.filter((task) => {
      if (dashboardFilter?.section === 'tasks') {
        if (dashboardFilter.taskStatus && task.status !== dashboardFilter.taskStatus) return false
        if (dashboardFilter.openTasks && isCompleteStatus(task.status)) return false
        if (dashboardFilter.overdueTasks && !(!isCompleteStatus(task.status) && task.dueDate < today())) return false
        if (dashboardFilter.taskDueWithinDays !== undefined) {
          const remaining = daysUntil(task.dueDate)
          if (isCompleteStatus(task.status) || remaining < 0 || remaining > dashboardFilter.taskDueWithinDays) return false
        }
        if (dashboardFilter.assignee && task.assignedTo !== dashboardFilter.assignee) return false
      }
      if (!value) return true
      return [task.title, task.assignedTo, task.priority, task.status]
        .join(' ')
        .toLowerCase()
        .includes(value)
    })
  }, [tasks, query, dashboardFilter])

  const filteredMilestones = useMemo(() => {
    if (dashboardFilter?.section !== 'milestones') return milestones
    return milestones.filter((milestone) =>
      dashboardFilter.openMilestones ? milestone.status !== 'Completed' : true,
    )
  }, [milestones, dashboardFilter])

  const filteredTeam = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return team
    return team.filter((member) =>
      [member.name, member.email, member.mobile, member.role, member.department, member.status]
        .join(' ')
        .toLowerCase()
        .includes(value),
    )
  }, [team, query])

  function openDashboardFilter(filter: DashboardFilter) {
    setDashboardFilter(filter)
    setQuery('')
    setActiveSection(filter.section)
    setDrilldown(null)
  }

  function selectSection(section: SectionKey) {
    setActiveSection(section)
    setDashboardFilter(null)
    setQuery('')
  }

  async function saveProject(project: Project) {
    const validationError = validateDateRange('Project', project.startDate, project.endDate)
    if (validationError) {
      flash(validationError)
      return
    }
    const saved = project.id
      ? await api.updateProject(project)
      : await api.createProject(project)
    setProjects((current) => upsert(current, saved, 'id'))
    setProjectModal(null)
    flash(live ? 'Project saved to Google Sheets' : 'Project saved locally')
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete project "${project.name}"?`)) return
    await api.deleteProject(project.id)
    setProjects((current) => current.filter((currentProject) => currentProject.id !== project.id))
    setTasks((current) => current.filter((task) => task.projectId !== project.id))
    setMilestones((current) => current.filter((milestone) => milestone.projectId !== project.id))
    flash(live ? 'Project deleted from Google Sheets' : 'Project deleted locally')
  }

  async function saveTask(task: TaskItem) {
    const parentStartDate = getTaskParentStartDate(task, projects, modules, subModules)
    const validationError = validateDueDate('Task', parentStartDate, task.dueDate)
    if (validationError) {
      flash(validationError)
      return
    }
    const saved = task.id ? await api.updateTask(task) : await api.createTask(task)
    const nextTasks = upsert(tasks, saved, 'id')
    setTasks(nextTasks)
    await syncHierarchyStatuses(nextTasks)
    setTaskModal(null)
    flash(live ? 'Task saved to Google Sheets' : 'Task saved locally')
  }

  function openNewTaskDraft(projectId: string, moduleId = '', submoduleId = '') {
    setTaskModal({
      id: '',
      projectId,
      moduleId,
      submoduleId,
      title: '',
      description: '',
      assignedTo: '',
      priority: 'Medium',
      status: 'Pending',
      dueDate: plusDays(7),
      checklist: '',
      attachmentUrl: '',
    })
  }

  async function saveModule(module: WorkModule) {
    const validationError = validateDateRange('Module', module.startDate, module.endDate)
    if (validationError) {
      flash(validationError)
      return
    }
    const saved = module.id ? await api.updateModule(module) : await api.createModule(module)
    const nextModules = upsert(modules, saved, 'id')
    setModules(nextModules)
    await syncHierarchyStatuses(tasks, nextModules, subModules)
    setModuleModal(null)
    flash(live ? 'Module saved to Google Sheets' : 'Module saved locally')
  }

  async function deleteModule(module: WorkModule) {
    if (!window.confirm(`Delete module "${module.name}"?`)) return
    await api.deleteModule(module.id)
    setModules((current) => current.filter((item) => item.id !== module.id))
    setSubModules((current) => current.filter((item) => item.moduleId !== module.id))
    setTasks((current) => current.filter((task) => task.moduleId !== module.id))
    flash(live ? 'Module deleted from Google Sheets' : 'Module deleted locally')
  }

  async function saveSubModule(submodule: SubModule) {
    const validationError = validateDateRange('Sub module', submodule.startDate, submodule.endDate)
    if (validationError) {
      flash(validationError)
      return
    }
    const saved = submodule.id
      ? await api.updateSubModule(submodule)
      : await api.createSubModule(submodule)
    const nextSubModules = upsert(subModules, saved, 'id')
    setSubModules(nextSubModules)
    await syncHierarchyStatuses(tasks, modules, nextSubModules)
    setSubModuleModal(null)
    flash(live ? 'Sub module saved to Google Sheets' : 'Sub module saved locally')
  }

  async function deleteSubModule(submodule: SubModule) {
    if (!window.confirm(`Delete sub module "${submodule.name}"?`)) return
    await api.deleteSubModule(submodule.id)
    setSubModules((current) => current.filter((item) => item.id !== submodule.id))
    setTasks((current) => current.filter((task) => task.submoduleId !== submodule.id))
    flash(live ? 'Sub module deleted from Google Sheets' : 'Sub module deleted locally')
  }

  async function addTaskComment(task: TaskItem, commentText: string) {
    const saved = await api.createComment({
      id: '',
      taskId: task.id,
      projectId: task.projectId,
      userId: 'system',
      comment: commentText,
      createdAt: new Date().toISOString(),
    })
    setComments((current) => [saved, ...current])
    flash(live ? 'Comment saved to Google Sheets' : 'Comment saved locally')
  }

  async function deleteTask(task: TaskItem) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return
    await api.deleteTask(task.id)
    setTasks((current) => current.filter((currentTask) => currentTask.id !== task.id))
    flash(live ? 'Task deleted from Google Sheets' : 'Task deleted locally')
  }

  async function saveMilestone(milestone: Milestone) {
    const project = projects.find((item) => item.id === milestone.projectId)
    const validationError = validateDueDate('Milestone', project?.startDate || '', milestone.dueDate)
    if (validationError) {
      flash(validationError)
      return
    }
    const saved = milestone.id
      ? await api.updateMilestone(milestone)
      : await api.createMilestone(milestone)
    setMilestones((current) => upsert(current, saved, 'id'))
    setMilestoneModal(null)
    flash(live ? 'Milestone saved to Google Sheets' : 'Milestone saved locally')
  }

  async function deleteMilestone(milestone: Milestone) {
    if (!window.confirm(`Delete milestone "${milestone.name}"?`)) return
    await api.deleteMilestone(milestone.id)
    setMilestones((current) => current.filter((currentMilestone) => currentMilestone.id !== milestone.id))
    flash(live ? 'Milestone deleted from Google Sheets' : 'Milestone deleted locally')
  }

  async function saveTeamMember(member: TeamMember) {
    const saved = member.id
      ? await api.updateTeamMember(member)
      : await api.createTeamMember(member)
    setTeam((current) => upsert(current, saved, 'id'))
    setTeamModal(null)
    flash(live ? 'Team member saved to Google Sheets' : 'Team member saved locally')
  }

  async function deleteTeamMember(member: TeamMember) {
    await api.deleteTeamMember(member.id)
    setTeam((current) => current.filter((currentMember) => currentMember.id !== member.id))
    flash(live ? 'Team member deleted from Google Sheets' : 'Team member deleted locally')
  }

  async function moveTask(task: TaskItem, status: string) {
    const updated = { ...task, status }
    const saved = await api.updateTask(updated)
    const nextTasks = upsert(tasks, saved, 'id')
    setTasks(nextTasks)
    await syncHierarchyStatuses(nextTasks)
    flash(live ? 'Task status synced' : 'Task status updated locally')
  }

  async function saveMailSchedule(settings: MailSettings[]) {
    const saved = await api.saveMailSettings(settings)
    setMailSettings(saved)
    flash(live ? 'Mail schedule saved to Google Sheets' : 'Mail schedule saved locally')
  }

  async function sendMailNow(settings: MailSettings) {
    const result = await api.sendProjectSummaryEmail(settings)
    flash(live ? `Mail sent to ${result.recipients} user(s)` : 'Mail preview simulated locally')
  }

  async function syncHierarchyStatuses(
    nextTasks: TaskItem[],
    nextModules = modules,
    nextSubModules = subModules,
    nextProjects = projects,
  ) {
    const syncedSubModules = nextSubModules.map((submodule) => ({
      ...submodule,
      status: deriveWorkStatus(calculateSubModuleProgress(submodule, nextTasks)),
    }))
    const syncedModules = nextModules.map((module) => ({
      ...module,
      status: deriveWorkStatus(calculateModuleProgress(module, syncedSubModules, nextTasks)),
    }))
    const syncedProjects = nextProjects.map((project) => ({
      ...project,
      status: deriveProjectStatus(calculateProjectProgress(project, syncedModules, syncedSubModules, nextTasks)),
      health: deriveProjectHealth(project, syncedModules, syncedSubModules, nextTasks),
    }))

    const changedSubModules = syncedSubModules.filter((item) =>
      nextSubModules.some((current) => current.id === item.id && current.status !== item.status),
    )
    const changedModules = syncedModules.filter((item) =>
      nextModules.some((current) => current.id === item.id && current.status !== item.status),
    )
    const changedProjects = syncedProjects.filter((item) =>
      nextProjects.some((current) =>
        current.id === item.id && (current.status !== item.status || current.health !== item.health),
      ),
    )

    if (changedSubModules.length) setSubModules(syncedSubModules)
    if (changedModules.length) setModules(syncedModules)
    if (changedProjects.length) setProjects(syncedProjects)

    await Promise.all([
      ...changedSubModules.map((submodule) => api.updateSubModule(submodule)),
      ...changedModules.map((module) => api.updateModule(module)),
      ...changedProjects.map((project) => api.updateProject(project)),
    ])
  }

  function flash(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const page = (
    <main className="workspace">
      <TopBar
        live={live}
        query={query}
        onQuery={setQuery}
        onMenu={() => setMenuOpen(true)}
        onRefresh={loadData}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={loadData} />
      ) : (
        <SectionContent
          active={activeSection}
          projects={filteredProjects}
          tasks={filteredTasks}
          team={filteredTeam}
          milestones={filteredMilestones}
          activity={activity}
          allProjects={projects}
          allModules={modules}
          allSubModules={subModules}
          allTeam={team}
          stats={stats}
          live={live}
          theme={theme}
          mailSettings={mailSettings}
          dashboardFilter={dashboardFilter}
          onNewProject={() => setProjectModal('new')}
          onEditProject={setProjectModal}
          onDeleteProject={deleteProject}
          onViewProject={setDetailProject}
          onNewTask={() => setTaskModal('new')}
          onEditTask={setTaskModal}
          onDeleteTask={deleteTask}
          onMoveTask={moveTask}
          onDrilldown={setDrilldown}
          onDashboardFilter={openDashboardFilter}
          onNewMilestone={() => setMilestoneModal('new')}
          onEditMilestone={setMilestoneModal}
          onDeleteMilestone={deleteMilestone}
          onNewTeamMember={() => setTeamModal('new')}
          onEditTeamMember={setTeamModal}
          onDeleteTeamMember={deleteTeamMember}
          onThemeChange={setTheme}
          onSaveMailSettings={saveMailSchedule}
          onSendMailNow={sendMailNow}
        />
      )}
    </main>
  )

  return (
    <div className={`app-shell theme-${theme}`}>
      <Sidebar
        active={activeSection}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={(section) => {
          selectSection(section)
          setMenuOpen(false)
        }}
      />
      {page}
      <BottomNav active={activeSection} onSelect={selectSection} />
      {projectModal && (
        <ProjectModal
          initial={projectModal === 'new' ? undefined : projectModal}
          team={team}
          onClose={() => setProjectModal(null)}
          onSave={saveProject}
        />
      )}
      {detailProject && (
        <ProjectDetail
          project={detailProject}
          tasks={tasks.filter((task) => task.projectId === detailProject.id)}
          modules={modules.filter((module) => module.projectId === detailProject.id)}
          subModules={subModules.filter((submodule) => submodule.projectId === detailProject.id)}
          milestones={milestones.filter((milestone) => milestone.projectId === detailProject.id)}
          onNewModule={() => setModuleModal({ projectId: detailProject.id })}
          onEditModule={(module) => setModuleModal({ projectId: detailProject.id, module })}
          onDeleteModule={deleteModule}
          onNewSubModule={(moduleId) => setSubModuleModal({ projectId: detailProject.id, moduleId })}
          onEditSubModule={(submodule) => setSubModuleModal({ projectId: detailProject.id, moduleId: submodule.moduleId, submodule })}
          onDeleteSubModule={deleteSubModule}
          onNewTask={(moduleId, submoduleId) => openNewTaskDraft(detailProject.id, moduleId, submoduleId)}
          onEditTask={setTaskModal}
          onClose={() => setDetailProject(null)}
        />
      )}
      {taskModal && (
        <TaskModal
          projects={projects}
          team={team}
          initial={taskModal === 'new' ? undefined : taskModal}
          modules={modules}
          subModules={subModules}
          comments={taskModal === 'new' || !taskModal.id ? [] : comments.filter((comment) => comment.taskId === taskModal.id)}
          onClose={() => setTaskModal(null)}
          onSave={saveTask}
          onAddComment={addTaskComment}
        />
      )}
      {drilldown && (
        <DrilldownPanel
          title={drilldown.title}
          rows={drilldown.rows}
          onClose={() => setDrilldown(null)}
        />
      )}
      {teamModal && (
        <TeamModal
          initial={teamModal === 'new' ? undefined : teamModal}
          onClose={() => setTeamModal(null)}
          onSave={saveTeamMember}
        />
      )}
      {milestoneModal && (
        <MilestoneModal
          projects={projects}
          team={team}
          initial={milestoneModal === 'new' ? undefined : milestoneModal}
          onClose={() => setMilestoneModal(null)}
          onSave={saveMilestone}
        />
      )}
      {moduleModal && (
        <ModuleModal
          projectId={moduleModal.projectId}
          team={team}
          initial={moduleModal.module}
          onClose={() => setModuleModal(null)}
          onSave={saveModule}
        />
      )}
      {subModuleModal && (
        <SubModuleModal
          projectId={subModuleModal.projectId}
          moduleId={subModuleModal.moduleId}
          team={team}
          initial={subModuleModal.submodule}
          onClose={() => setSubModuleModal(null)}
          onSave={saveSubModule}
        />
      )}
      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}

function BottomNav({
  active,
  onSelect,
}: {
  active: SectionKey
  onSelect: (section: SectionKey) => void
}) {
  const tabs = sections.filter(({ key }) =>
    ['dashboard', 'projects', 'tasks', 'team', 'settings'].includes(key),
  )

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          className={active === key ? 'active' : ''}
          key={key}
          onClick={() => onSelect(key)}
        >
          <Icon size={21} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function Sidebar({
  active,
  open,
  onClose,
  onSelect,
}: {
  active: SectionKey
  open: boolean
  onClose: () => void
  onSelect: (section: SectionKey) => void
}) {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <FolderKanban size={24} />
          </div>
          <div>
            <strong>Project OS</strong>
            <span>Sheets powered PWA</span>
          </div>
          <button className="icon-button mobile-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <nav>
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              className={`nav-item ${active === key ? 'active' : ''}`}
              key={key}
              onClick={() => onSelect(key)}
            >
              <Icon size={21} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sync-card">
          <Cloud size={20} />
          <strong>Google Sheets Sync</strong>
          <span>Use Apps Script Web App as the secure API layer.</span>
        </div>
      </aside>
      {open && <button className="scrim" onClick={onClose} />}
    </>
  )
}

function TopBar({
  live,
  query,
  onQuery,
  onMenu,
  onRefresh,
}: {
  live: boolean
  query: string
  onQuery: (value: string) => void
  onMenu: () => void
  onRefresh: () => void
}) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <label className="search">
        <Search size={22} />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search projects, tasks, owners"
        />
      </label>
      <span className={`status-pill ${live ? 'live' : ''}`}>
        {live ? <Cloud size={17} /> : <CloudOff size={17} />}
        {live ? 'Google Sheet Live' : 'Local Demo'}
      </span>
      <button className="icon-button" onClick={onRefresh}>
        <RefreshCw size={19} />
      </button>
      <button className="icon-button">
        <Bell size={19} />
      </button>
      <div className="avatar">AD</div>
    </header>
  )
}

function SectionContent(props: {
  active: SectionKey
  projects: Project[]
  tasks: TaskItem[]
  team: TeamMember[]
  milestones: Milestone[]
  activity: ActivityItem[]
  allProjects: Project[]
  allModules: WorkModule[]
  allSubModules: SubModule[]
  allTeam: TeamMember[]
  stats: DashboardStats
  live: boolean
  theme: AppTheme
  mailSettings: MailSettings[]
  dashboardFilter: DashboardFilter | null
  onNewProject: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onViewProject: (project: Project) => void
  onNewTask: () => void
  onEditTask: (task: TaskItem) => void
  onDeleteTask: (task: TaskItem) => void
  onMoveTask: (task: TaskItem, status: string) => void
  onDrilldown: (drilldown: { title: string; rows: string[] }) => void
  onDashboardFilter: (filter: DashboardFilter) => void
  onNewMilestone: () => void
  onEditMilestone: (milestone: Milestone) => void
  onDeleteMilestone: (milestone: Milestone) => void
  onNewTeamMember: () => void
  onEditTeamMember: (member: TeamMember) => void
  onDeleteTeamMember: (member: TeamMember) => void
  onThemeChange: (theme: AppTheme) => void
  onSaveMailSettings: (settings: MailSettings[]) => Promise<void>
  onSendMailNow: (settings: MailSettings) => Promise<void>
}) {
  const {
    active,
    projects,
    tasks,
    team,
    milestones,
    activity,
    allProjects,
    allModules,
    allSubModules,
    allTeam,
    stats,
    live,
    theme,
    mailSettings,
    dashboardFilter,
    onNewProject,
    onEditProject,
    onDeleteProject,
    onViewProject,
    onNewTask,
    onEditTask,
    onDeleteTask,
    onMoveTask,
    onDrilldown,
    onDashboardFilter,
    onNewMilestone,
    onEditMilestone,
    onDeleteMilestone,
    onNewTeamMember,
    onEditTeamMember,
    onDeleteTeamMember,
    onThemeChange,
    onSaveMailSettings,
    onSendMailNow,
  } = props

  if (active === 'projects') {
    return (
      <>
        <PageHeader
          title={dashboardFilter?.section === 'projects' ? dashboardFilter.title : 'Projects'}
          subtitle="Create, edit, and track project portfolio records."
        />
        <ProjectTable
          projects={projects}
          tasks={tasks}
          modules={allModules}
          subModules={allSubModules}
          onNewProject={onNewProject}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          onViewProject={onViewProject}
        />
      </>
    )
  }

  if (active === 'tasks') {
    return (
      <>
        <PageHeader
          title={dashboardFilter?.section === 'tasks' ? dashboardFilter.title : 'Tasks'}
          subtitle="Kanban workflow for project delivery."
        />
        <TaskBoard
          projects={allProjects}
          tasks={tasks}
          onNewTask={onNewTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
        />
      </>
    )
  }

  if (active === 'milestones') {
    return (
      <>
        <PageHeader
          title={dashboardFilter?.section === 'milestones' ? dashboardFilter.title : 'Milestones'}
          subtitle="Upcoming delivery dates and checkpoints."
        />
        <Milestones
          projects={allProjects}
          milestones={milestones}
          onNewMilestone={onNewMilestone}
          onEditMilestone={onEditMilestone}
          onDeleteMilestone={onDeleteMilestone}
        />
      </>
    )
  }

  if (active === 'team') {
    return (
      <>
        <PageHeader title="Team" subtitle="Configure members, ownership, capacity, and workload." />
        <TeamView
          members={team}
          projects={projects}
          tasks={tasks}
          onMemberSelect={(member) =>
            onDashboardFilter({ section: 'tasks', title: `${member.name} Tasks`, assignee: member.name })
          }
          onNewMember={onNewTeamMember}
          onEditMember={onEditTeamMember}
          onDeleteMember={onDeleteTeamMember}
        />
      </>
    )
  }

  if (active === 'reports') {
    return (
      <>
        <PageHeader title="Reports" subtitle="Portfolio health and task summary." />
        <Reports
          stats={stats}
          projects={allProjects}
          modules={allModules}
          subModules={allSubModules}
          tasks={tasks}
          team={team}
          milestones={milestones}
        />
      </>
    )
  }

  if (active === 'settings') {
    return (
      <>
        <PageHeader title="Settings" subtitle="Google Sheets API and deployment status." />
        <SettingsView
          live={live}
          theme={theme}
          team={allTeam}
          mailSettings={mailSettings}
          onThemeChange={onThemeChange}
          onSaveMailSettings={onSaveMailSettings}
          onSendMailNow={onSendMailNow}
        />
      </>
    )
  }

  return (
    <>
      <Hero
        stats={stats}
        projects={allProjects}
        modules={allModules}
        subModules={allSubModules}
        tasks={tasks}
        onNewProject={onNewProject}
      />
      <StatsGrid stats={stats} onDashboardFilter={onDashboardFilter} />
      <DashboardCharts
        projects={allProjects}
        tasks={tasks}
        modules={allModules}
        subModules={allSubModules}
        team={allTeam}
        milestones={milestones}
        onDrilldown={onDrilldown}
        onDashboardFilter={onDashboardFilter}
      />
      <DateAnalytics
        stats={stats}
        projects={allProjects}
        tasks={tasks}
        milestones={milestones}
        onDashboardFilter={onDashboardFilter}
      />
      <GanttChart
        projects={allProjects}
        modules={allModules}
        subModules={allSubModules}
        tasks={tasks}
        onDashboardFilter={onDashboardFilter}
      />
      <div className="two-column">
        <ProjectTable
          projects={projects}
          tasks={tasks}
          modules={allModules}
          subModules={allSubModules}
          onNewProject={onNewProject}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          onViewProject={onViewProject}
        />
        <TeamView
          members={allTeam}
          projects={projects}
          tasks={tasks}
          compact
          onMemberSelect={(member) =>
            onDashboardFilter({ section: 'tasks', title: `${member.name} Tasks`, assignee: member.name })
          }
        />
      </div>
      <TaskBoard
        projects={allProjects}
        tasks={tasks}
        onNewTask={onNewTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onMoveTask={onMoveTask}
      />
      <ActivityFeed activity={activity} />
    </>
  )
}

function Hero({
  stats,
  projects,
  modules,
  subModules,
  tasks,
  onNewProject,
}: {
  stats: DashboardStats
  projects: Project[]
  modules: WorkModule[]
  subModules: SubModule[]
  tasks: TaskItem[]
  onNewProject: () => void
}) {
  const progress = stats.totalProjects
    ? stats.portfolioProgress
    : 0
  const heroProgress = projects
    .map((project) => ({
      label: project.name,
      value: calculateProjectProgress(project, modules, subModules, tasks),
    }))
    .sort((first, second) => second.value - first.value)
    .slice(0, 3)

  return (
    <section className="hero-card">
      <div>
        <p className="eyebrow">Portfolio Command Center</p>
        <h1>Project Management Workspace</h1>
        <p>
          Manage project plans, task ownership, overdue work, and Google Sheets
          sync from one installable mobile-ready PWA.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onNewProject}>
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>
      <div className="completion-card hero-chart-card">
        <div className="hero-completion-head">
          <strong>{progress}%</strong>
          <span>Portfolio completion</span>
        </div>
        <div className="progress">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="hero-mini-chart">
          {heroProgress.length === 0 ? (
            <small>No project progress yet</small>
          ) : (
            heroProgress.map((item) => (
              <div className="hero-mini-row" key={item.label}>
                <span>{item.label}</span>
                <div><i style={{ width: `${item.value}%` }} /></div>
                <b>{item.value}%</b>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </section>
  )
}

function StatsGrid({
  stats,
  onDashboardFilter,
}: {
  stats: DashboardStats
  onDashboardFilter?: (filter: DashboardFilter) => void
}) {
  const cards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      filter: { section: 'projects', title: 'All Projects' } as DashboardFilter,
    },
    {
      label: 'Active',
      value: stats.activeProjects,
      icon: Gauge,
      filter: { section: 'projects', title: 'Active Projects', projectDerivedStatus: 'Active' } as DashboardFilter,
    },
    {
      label: 'Completed',
      value: stats.completedProjects,
      icon: CheckCircle2,
      filter: { section: 'projects', title: 'Completed Projects', projectDerivedStatus: 'Completed' } as DashboardFilter,
    },
    {
      label: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: ListChecks,
      filter: { section: 'tasks', title: 'Open Tasks', openTasks: true } as DashboardFilter,
    },
    {
      label: 'Overdue',
      value: stats.overdueTasks,
      icon: AlertTriangle,
      filter: { section: 'tasks', title: 'Overdue Tasks', overdueTasks: true } as DashboardFilter,
    },
    {
      label: 'On Track',
      value: stats.onTrackProjects,
      icon: Gauge,
      filter: { section: 'projects', title: 'On Track Projects', projectHealth: 'On Track' } as DashboardFilter,
    },
    {
      label: 'At Risk',
      value: stats.atRiskProjects,
      icon: AlertTriangle,
      filter: { section: 'projects', title: 'At Risk Projects', projectHealth: 'At Risk' } as DashboardFilter,
    },
    {
      label: 'Delayed',
      value: stats.delayedProjects,
      icon: CalendarDays,
      filter: { section: 'projects', title: 'Delayed Projects', projectHealth: 'Delayed' } as DashboardFilter,
    },
  ]
  return (
    <section className="stat-grid">
      {cards.map(({ label, value, icon: Icon, filter }) => (
        <button
          className="stat-card"
          key={label}
          onClick={() => onDashboardFilter?.(filter)}
        >
          <div>
            <Icon size={22} />
          </div>
          <strong>{value}</strong>
          <span>{label}</span>
        </button>
      ))}
    </section>
  )
}

function DashboardCharts({
  projects,
  tasks,
  modules,
  subModules,
  team,
  milestones,
  onDrilldown,
  onDashboardFilter,
}: {
  projects: Project[]
  tasks: TaskItem[]
  modules: WorkModule[]
  subModules: SubModule[]
  team: TeamMember[]
  milestones: Milestone[]
  onDrilldown: (drilldown: { title: string; rows: string[] }) => void
  onDashboardFilter: (filter: DashboardFilter) => void
}) {
  const projectStatus = groupCounts(
    projects.map((project) => getProjectDerivedStatus(project, modules, subModules, tasks)),
  )
  const taskStatus = taskStatuses.map((status) => ({
    label: status,
    value: tasks.filter((task) => task.status === status).length,
    rows: tasks.filter((task) => task.status === status).map((task) => task.title),
    filter: { section: 'tasks', title: `${status} Tasks`, taskStatus: status } as DashboardFilter,
  }))
  const health = projectHealth.map((status) => ({
    label: status,
    value: projects.filter((project) => deriveProjectHealth(project, modules, subModules, tasks) === status).length,
    rows: projects
      .filter((project) => deriveProjectHealth(project, modules, subModules, tasks) === status)
      .map((project) => project.name),
    filter: { section: 'projects', title: `${status} Projects`, projectHealth: status } as DashboardFilter,
  }))
  const workload = team.map((member) => {
    const assigned = tasks.filter((task) => task.assignedTo === member.name)
    return {
      label: member.name,
      value: assigned.length,
      rows: assigned.map((task) => task.title),
      filter: { section: 'tasks', title: `${member.name} Tasks`, assignee: member.name } as DashboardFilter,
    }
  })
  const milestoneDone = milestones.filter((milestone) => milestone.status === 'Completed').length
  const milestoneOpen = milestones.length - milestoneDone
  const projectProgress = projects.map((project) => ({
    id: project.id,
    label: project.name,
    value: calculateProjectProgress(project, modules, subModules, tasks),
  }))

  return (
    <section className="chart-grid">
      <article className="panel chart-panel progress-chart-panel">
        <PanelTitle title="Project Progress" />
        <ProgressChart
          items={projectProgress}
          onSelect={(item) => {
            const project = projects.find((project) => project.name === item.label)
            if (project) onDashboardFilter({ section: 'projects', title: item.label, projectId: project.id })
          }}
        />
      </article>
      <article className="panel chart-panel">
        <PanelTitle title="Portfolio Health" />
        <div className="donut-row">
          {health.map((item) => (
            <button
              className="donut-slice"
              key={item.label}
              onClick={() => onDashboardFilter(item.filter)}
            >
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </article>
      <article className="panel chart-panel">
        <PanelTitle title="Task Pipeline" />
        <BarList items={taskStatus} onDrilldown={onDrilldown} onDashboardFilter={onDashboardFilter} />
      </article>
      <article className="panel chart-panel">
        <PanelTitle title="Team Workload" />
        <BarList items={workload} onDrilldown={onDrilldown} onDashboardFilter={onDashboardFilter} />
      </article>
      <article className="panel chart-panel">
        <PanelTitle title="Milestone Progress" />
        <button
          className="big-metric"
          onClick={() =>
            onDashboardFilter({
              section: 'milestones',
              title: 'Open Milestones',
              openMilestones: true,
            })
          }
        >
          <strong>{milestoneDone}/{milestones.length}</strong>
          <span>Completed milestones</span>
          <div className="progress">
            <i style={{ width: `${milestones.length ? (milestoneDone / milestones.length) * 100 : 0}%` }} />
          </div>
          <small>{milestoneOpen} open</small>
        </button>
      </article>
      <article className="panel chart-panel">
        <PanelTitle title="Project Status" />
        <BarList
          items={projectStatus.map((item) => ({
            ...item,
            rows: projects
              .filter((project) => getProjectDerivedStatus(project, modules, subModules, tasks) === item.label)
              .map((project) => project.name),
            filter: {
              section: 'projects',
              title: `${item.label} Projects`,
              projectDerivedStatus: item.label as DashboardFilter['projectDerivedStatus'],
            } as DashboardFilter,
          }))}
          onDrilldown={onDrilldown}
          onDashboardFilter={onDashboardFilter}
        />
      </article>
    </section>
  )
}

function ProgressChart({
  items,
  onSelect,
}: {
  items: Array<{ id?: string; label: string; value: number }>
  onSelect: (item: { label: string; value: number }) => void
}) {
  return (
    <div className="progress-chart">
      {items.length === 0 ? (
        <div className="empty-table">No project progress yet</div>
      ) : (
        items.slice(0, 6).map((item) => (
          <button className="progress-chart-row" key={item.label} onClick={() => onSelect(item)}>
            <span>{item.label}</span>
            <div>
              <i style={{ width: `${item.value}%` }} />
            </div>
            <strong>{item.value}%</strong>
          </button>
        ))
      )}
    </div>
  )
}

function DateAnalytics({
  stats,
  projects,
  tasks,
  milestones,
  onDashboardFilter,
}: {
  stats: DashboardStats
  projects: Project[]
  tasks: TaskItem[]
  milestones: Milestone[]
  onDashboardFilter?: (filter: DashboardFilter) => void
}) {
  const openMilestones = milestones.filter((milestone) => milestone.status !== 'Completed')
  const upcomingMilestones = openMilestones.filter((milestone) => daysUntil(milestone.dueDate) >= 0)
  const overdueMilestones = openMilestones.filter((milestone) => daysUntil(milestone.dueDate) < 0)
  const dueThisWeekTasks = tasks.filter(
    (task) => !isCompleteStatus(task.status) && daysUntil(task.dueDate) >= 0 && daysUntil(task.dueDate) <= 7,
  )
  const measurementRows = [
    {
      label: 'Projects due in 7 days',
      value: stats.dueThisWeek,
      action: () =>
        onDashboardFilter?.({
          section: 'projects',
          title: 'Projects Due This Week',
          projectDueWithinDays: 7,
        }),
    },
    {
      label: 'Projects due in 30 days',
      value: stats.dueThisMonth,
      action: () =>
        onDashboardFilter?.({
          section: 'projects',
          title: 'Projects Due This Month',
          projectDueWithinDays: 30,
        }),
    },
    {
      label: 'Tasks due this week',
      value: dueThisWeekTasks.length,
      action: () =>
        onDashboardFilter?.({
          section: 'tasks',
          title: 'Tasks Due This Week',
          taskDueWithinDays: 7,
        }),
    },
    {
      label: 'Open milestones',
      value: openMilestones.length,
      action: () => onDashboardFilter?.({ section: 'milestones', title: 'Open Milestones', openMilestones: true }),
    },
  ]
  const max = Math.max(1, ...measurementRows.map((row) => row.value))

  return (
    <section className="panel measurement-panel">
      <PanelTitle title="Date Wise Analytics" />
      <div className="measurement-grid">
        {measurementRows.map((row) => (
          <button className="measurement-card" key={row.label} onClick={row.action}>
            <strong>{row.value}</strong>
            <span>{row.label}</span>
            <div><i style={{ width: `${(row.value / max) * 100}%` }} /></div>
          </button>
        ))}
      </div>
      <div className="measurement-summary">
        <span>{projects.length} projects measured</span>
        <span>{stats.overdueTasks} overdue tasks</span>
        <span>{overdueMilestones.length} overdue milestones</span>
        <span>{upcomingMilestones.slice(0, 1)[0]?.dueDate || 'No upcoming milestone'}</span>
      </div>
    </section>
  )
}

function GanttChart({
  projects,
  modules,
  subModules,
  tasks,
  onDashboardFilter,
}: {
  projects: Project[]
  modules: WorkModule[]
  subModules: SubModule[]
  tasks: TaskItem[]
  onDashboardFilter?: (filter: DashboardFilter) => void
}) {
  const rows = projects
    .map((project) => ({
      id: project.id,
      label: project.name,
      start: project.startDate,
      end: project.endDate,
      progress: calculateProjectProgress(project, modules, subModules, tasks),
      health: deriveProjectHealth(project, modules, subModules, tasks),
    }))
    .filter((row) => row.start && row.end)
    .sort((first, second) => first.start.localeCompare(second.start))
    .slice(0, 8)
  const dates = rows.flatMap((row) => [new Date(`${row.start}T00:00:00`), new Date(`${row.end}T00:00:00`)])
  const minTime = dates.length ? Math.min(...dates.map((date) => date.getTime())) : Date.now()
  const maxTime = dates.length ? Math.max(...dates.map((date) => date.getTime())) : Date.now()
  const range = Math.max(1, maxTime - minTime)

  return (
    <section className="panel gantt-panel">
      <PanelTitle title="Gantt Timeline" />
      {rows.length === 0 ? (
        <div className="empty-table">Add project start and end dates to view the Gantt timeline.</div>
      ) : (
        <div className="gantt-list">
          {rows.map((row) => {
            const startTime = new Date(`${row.start}T00:00:00`).getTime()
            const endTime = new Date(`${row.end}T00:00:00`).getTime()
            const left = ((startTime - minTime) / range) * 100
            const width = Math.max(3, ((endTime - startTime) / range) * 100)

            return (
              <button
                className="gantt-row"
                key={row.id}
                onClick={() => onDashboardFilter?.({ section: 'projects', title: row.label, projectId: row.id })}
              >
                <span>
                  <strong>{row.label}</strong>
                  <small>{row.start} to {row.end}</small>
                </span>
                <div className="gantt-track">
                  <i style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}>
                    <b style={{ width: `${row.progress}%` }} />
                  </i>
                </div>
                <em>{row.progress}%</em>
                <small>{row.health}</small>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

function BarList({
  items,
  onDrilldown,
  onDashboardFilter,
}: {
  items: Array<{ label: string; value: number; rows: string[]; filter?: DashboardFilter }>
  onDrilldown: (drilldown: { title: string; rows: string[] }) => void
  onDashboardFilter?: (filter: DashboardFilter) => void
}) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <div className="bar-list">
      {items.map((item) => (
        <button
          className="bar-item"
          key={item.label}
          onClick={() =>
            item.filter && onDashboardFilter
              ? onDashboardFilter(item.filter)
              : onDrilldown({ title: item.label, rows: item.rows })
          }
        >
          <span>{item.label}</span>
          <div><i style={{ width: `${(item.value / max) * 100}%` }} /></div>
          <strong>{item.value}</strong>
        </button>
      ))}
    </div>
  )
}

function ProjectTable({
  projects,
  tasks,
  modules,
  subModules,
  onNewProject,
  onEditProject,
  onDeleteProject,
  onViewProject,
}: {
  projects: Project[]
  tasks: TaskItem[]
  modules: WorkModule[]
  subModules: SubModule[]
  onNewProject: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onViewProject: (project: Project) => void
}) {
  return (
    <section className="panel">
      <PanelTitle title="Projects" action="Add Project" onAction={onNewProject} />
      <div className="table-wrap">
        <table className="project-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Tasks</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="drill-row"
                onClick={() => onViewProject(project)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onViewProject(project)
                }}
              >
                <td>
                  <strong>{project.name}</strong>
                  <small>{project.description}</small>
                </td>
                <td>{project.managerName}</td>
                <td>
                  <span className="chip">
                    {deriveProjectStatus(calculateProjectProgress(project, modules, subModules, tasks))}
                  </span>
                </td>
                <td>
                  <ProgressMeter
                    value={calculateProjectProgress(project, modules, subModules, tasks)}
                  />
                </td>
                <td>{tasks.filter((task) => task.projectId === project.id).length}</td>
                <td>{project.endDate}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-button" onClick={(event) => { event.stopPropagation(); onViewProject(project) }}>
                      <ChevronRight size={17} />
                    </button>
                    <button className="icon-button" onClick={(event) => { event.stopPropagation(); onEditProject(project) }}>
                      <Edit3 size={17} />
                    </button>
                    <button className="icon-button danger" onClick={(event) => { event.stopPropagation(); onDeleteProject(project) }}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TaskBoard({
  projects,
  tasks,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
}: {
  projects: Project[]
  tasks: TaskItem[]
  onNewTask: () => void
  onEditTask: (task: TaskItem) => void
  onDeleteTask: (task: TaskItem) => void
  onMoveTask: (task: TaskItem, status: string) => void
}) {
  const projectName = (id: string) => projects.find((project) => project.id === id)?.name ?? id
  return (
    <section className="panel">
      <PanelTitle title="Task Board" action="Add Task" onAction={onNewTask} />
      <div className="board">
        {taskStatuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status)
          return (
            <div
              className="board-column"
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const taskId = event.dataTransfer.getData('text/plain')
                const task = tasks.find((task) => task.id === taskId)
                if (task && task.status !== status) onMoveTask(task, status)
              }}
            >
              <div className="column-title">
                <strong>{status}</strong>
                <span>{statusTasks.length}</span>
              </div>
              {statusTasks.length === 0 ? (
                <div className="empty-card">No tasks</div>
              ) : (
                statusTasks.map((task) => (
                  <article
                    className="task-card"
                    key={task.id}
                    draggable
                    onClick={() => onEditTask(task)}
                    onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') onEditTask(task)
                    }}
                  >
                    <strong>{task.title}</strong>
                    <small>{projectName(task.projectId)}</small>
                    <div className="task-meta">
                      <span className={`priority ${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <span>{task.dueDate}</span>
                    </div>
                    <div className="task-footer">
                      <span className="avatar small">{initials(task.assignedTo)}</span>
                      <span>{task.assignedTo}</span>
                      <div className="row-actions">
                        <button className="icon-button" onClick={(event) => { event.stopPropagation(); onEditTask(task) }}>
                          <Edit3 size={15} />
                        </button>
                        <button className="icon-button danger" onClick={(event) => { event.stopPropagation(); onDeleteTask(task) }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="move-row">
                      {taskStatuses
                        .filter((next) => next !== task.status)
                        .map((next) => (
                          <button key={next} onClick={(event) => { event.stopPropagation(); onMoveTask(task, next) }}>
                            {next}
                          </button>
                        ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TeamView({
  members,
  projects,
  tasks,
  compact = false,
  onMemberSelect,
  onNewMember,
  onEditMember,
  onDeleteMember,
}: {
  members: TeamMember[]
  projects: Project[]
  tasks: TaskItem[]
  compact?: boolean
  onMemberSelect?: (member: TeamMember) => void
  onNewMember?: () => void
  onEditMember?: (member: TeamMember) => void
  onDeleteMember?: (member: TeamMember) => void
}) {
  const workload = (member: TeamMember) => ({
    projects: projects.filter((project) => project.managerName === member.name).length,
    tasks: tasks.filter((task) => task.assignedTo === member.name).length,
  })

  const activeMembers = members.filter((member) => member.status === 'Active').length
  const averageCapacity = members.length
    ? Math.round(
        members.reduce((total, member) => total + Number(member.capacity || 0), 0) /
          members.length,
      )
    : 0

  return (
    <section className="panel">
      <PanelTitle
        title={compact ? 'Team Load' : 'Team Configuration'}
        action={!compact ? 'Add Member' : undefined}
        onAction={onNewMember}
      />
      {!compact && (
        <div className="team-summary">
          <article>
            <strong>{members.length}</strong>
            <span>Total members</span>
          </article>
          <article>
            <strong>{activeMembers}</strong>
            <span>Active</span>
          </article>
          <article>
            <strong>{averageCapacity}%</strong>
            <span>Avg capacity</span>
          </article>
        </div>
      )}
      <div className="team-list">
        {members.map((member) => {
          const load = workload(member)
          const loadPercent = Math.min(
            100,
            Math.round(((load.projects * 20 + load.tasks * 10) / Number(member.capacity || 100)) * 100),
          )
          return (
          <article
            className={`team-row team-member-card ${compact ? 'compact-team-card' : ''}`}
            key={member.id}
            onClick={() => onMemberSelect?.(member)}
            role={onMemberSelect ? 'button' : undefined}
            tabIndex={onMemberSelect ? 0 : undefined}
            onKeyDown={(event) => {
              if (onMemberSelect && (event.key === 'Enter' || event.key === ' ')) onMemberSelect(member)
            }}
          >
            <span className="avatar small">{initials(member.name)}</span>
            <div>
              <strong>{member.name}</strong>
              <small>
                {member.role || 'Team member'} · {member.department || 'General'}
              </small>
              {!compact && (
                <small>
                  {member.email || 'No email'} · {member.mobile || 'No mobile'}
                </small>
              )}
              <div className="load-meter">
                <i style={{ width: `${loadPercent}%` }} />
              </div>
            </div>
            <span className={`chip ${member.status === 'Active' ? '' : 'muted'}`}>
              {member.status}
            </span>
            {!compact && (
              <div className="row-actions">
                <button className="icon-button" onClick={(event) => { event.stopPropagation(); onEditMember?.(member) }}>
                  <Edit3 size={16} />
                </button>
                <button className="icon-button danger" onClick={(event) => { event.stopPropagation(); onDeleteMember?.(member) }}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            {compact && <ChevronRight size={18} />}
          </article>
          )
        })}
      </div>
    </section>
  )
}

function Milestones({
  projects,
  milestones,
  onNewMilestone,
  onEditMilestone,
  onDeleteMilestone,
}: {
  projects: Project[]
  milestones: Milestone[]
  onNewMilestone: () => void
  onEditMilestone: (milestone: Milestone) => void
  onDeleteMilestone: (milestone: Milestone) => void
}) {
  const projectName = (id: string) => projects.find((project) => project.id === id)?.name ?? id
  return (
    <section className="panel">
      <PanelTitle title="Milestone Plan" action="Add Milestone" onAction={onNewMilestone} />
      <div className="timeline">
        {[...milestones]
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((milestone) => (
            <article key={milestone.id}>
              <i />
              <div>
                <strong>{milestone.name}</strong>
                <span>{projectName(milestone.projectId)} · {milestone.owner}</span>
              </div>
              <span className="chip">{milestone.status}</span>
              <time>{milestone.dueDate}</time>
              <div className="row-actions">
                <button className="icon-button" onClick={() => onEditMilestone(milestone)}>
                  <Edit3 size={16} />
                </button>
                <button className="icon-button danger" onClick={() => onDeleteMilestone(milestone)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
      </div>
    </section>
  )
}

function Reports({
  stats,
  projects,
  modules,
  subModules,
  tasks,
  team,
  milestones,
}: {
  stats: DashboardStats
  projects: Project[]
  modules: WorkModule[]
  subModules: SubModule[]
  tasks: TaskItem[]
  team: TeamMember[]
  milestones: Milestone[]
}) {
  const overdue = tasks.filter((task) => task.status !== 'Done' && task.dueDate < today()).length
  const atRisk = projects.filter((project) =>
    deriveProjectHealth(project, modules, subModules, tasks) !== 'On Track',
  ).length
  const completedMilestones = milestones.filter((milestone) => milestone.status === 'Completed').length
  return (
    <section className="report-grid">
      <StatsGrid stats={stats} />
      <div className="stat-grid">
        <article className="stat-card">
          <div><AlertTriangle size={22} /></div>
          <strong>{atRisk}</strong>
          <span>At Risk Projects</span>
        </article>
        <article className="stat-card">
          <div><Users size={22} /></div>
          <strong>{team.length}</strong>
          <span>Team Members</span>
        </article>
        <article className="stat-card">
          <div><CalendarDays size={22} /></div>
          <strong>{completedMilestones}/{milestones.length}</strong>
          <span>Milestones Done</span>
        </article>
        <article className="stat-card">
          <div><ListChecks size={22} /></div>
          <strong>{overdue}</strong>
          <span>Overdue Tasks</span>
        </article>
      </div>
      <article className="panel install-panel">
        <PanelTitle title="Project Progress" />
        <ProgressChart
          items={projects.map((project) => ({
            id: project.id,
            label: project.name,
            value: calculateProjectProgress(project, modules, subModules, tasks),
          }))}
          onSelect={() => undefined}
        />
      </article>
      <DateAnalytics stats={stats} projects={projects} tasks={tasks} milestones={milestones} />
      <GanttChart projects={projects} modules={modules} subModules={subModules} tasks={tasks} />
    </section>
  )
}

function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  const [open, setOpen] = useState(true)
  const recentActivity = activity.slice(0, 8)

  return (
    <section className="panel activity-panel">
      <div className="panel-title">
        <h2>Recent Activity</h2>
        <button
          className="text-button compact-toggle"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <ChevronRight className={open ? 'rotate-icon' : ''} size={17} />
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && (
        <div className="timeline activity-list">
          {recentActivity.length === 0 ? (
            <article className="activity-row">
              <i />
              <div className="activity-main">
                <strong>No activity yet</strong>
                <span>Changes will appear here after Google Sheets sync.</span>
              </div>
            </article>
          ) : (
            recentActivity.map((item) => (
              <article className="activity-row" key={item.id}>
                <i />
                <div className="activity-main">
                  <strong>{formatActivityLabel(item.action)}</strong>
                  <span>{formatActivityLabel(item.module)}</span>
                </div>
                <code>{item.referenceId || '-'}</code>
                <time>{formatActivityTime(item.timestamp)}</time>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  )
}

function SettingsView({
  live,
  theme,
  team,
  mailSettings,
  onThemeChange,
  onSaveMailSettings,
  onSendMailNow,
}: {
  live: boolean
  theme: AppTheme
  team: TeamMember[]
  mailSettings: MailSettings[]
  onThemeChange: (theme: AppTheme) => void
  onSaveMailSettings: (settings: MailSettings[]) => Promise<void>
  onSendMailNow: (settings: MailSettings) => Promise<void>
}) {
  const apiUrl = import.meta.env.VITE_APPS_SCRIPT_URL || 'Local demo mode'
  return (
    <div className="settings-stack">
      <MailSettingsPanel
        team={team}
        settings={mailSettings}
        onSave={onSaveMailSettings}
        onSendNow={onSendMailNow}
      />
      <section className="panel settings-panel">
        <PanelTitle title="Theme" />
        <div className="theme-options">
          <button
            className={`theme-option ${theme === 'classic' ? 'active' : ''}`}
            onClick={() => onThemeChange('classic')}
          >
            <span className="theme-preview classic-preview" />
            <strong>Classic</strong>
            <small>Existing light workspace</small>
          </button>
          <button
            className={`theme-option ${theme === 'premium-dark' ? 'active' : ''}`}
            onClick={() => onThemeChange('premium-dark')}
          >
            <span className="theme-preview premium-preview" />
            <strong>Premium Dark</strong>
            <small>Dark neumorphic mobile style</small>
          </button>
        </div>
      </section>
      <section className="panel settings-panel">
        <PanelTitle title="Connection" />
        <dl>
          <dt>Current mode</dt>
          <dd>{live ? 'Google Sheet Live' : 'Local Demo'}</dd>
          <dt>Google Sheet</dt>
          <dd>
            <a href="https://docs.google.com/spreadsheets/d/1fK3XlGm5A0ZtCQ8ZXFC2WIVXfZTTLV47FNLza7uMl5I/edit" target="_blank">
              Project Management Database
            </a>
          </dd>
          <dt>Apps Script API</dt>
          <dd>{apiUrl}</dd>
          <dt>Build version</dt>
          <dd>{buildVersion}</dd>
        </dl>
      </section>
    </div>
  )
}

function MailSettingsPanel({
  team,
  settings,
  onSave,
  onSendNow,
}: {
  team: TeamMember[]
  settings: MailSettings[]
  onSave: (settings: MailSettings[]) => Promise<void>
  onSendNow: (settings: MailSettings) => Promise<void>
}) {
  const [forms, setForms] = useState<MailSettings[]>(settings.length ? settings : [defaultMailSettings])
  const [activeIndex, setActiveIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const activeUsers = team.filter((member) => member.status !== 'Inactive' && member.email)
  const form = forms[Math.min(activeIndex, forms.length - 1)] ?? defaultMailSettings

  function updateActive(updater: (current: MailSettings) => MailSettings) {
    setForms((current) => current.map((item, index) => (index === activeIndex ? updater(item) : item)))
  }

  function toggleRecipient(memberId: string) {
    updateActive((current) => ({
      ...current,
      recipients: current.recipients.includes(memberId)
        ? current.recipients.filter((id) => id !== memberId)
        : [...current.recipients, memberId],
    }))
  }

  async function submitSave() {
    setSaving(true)
    try {
      await onSave(forms)
    } finally {
      setSaving(false)
    }
  }

  async function submitTest() {
    setTesting(true)
    try {
      await onSendNow(form)
    } finally {
      setTesting(false)
    }
  }

  function addSchedule() {
    const next = {
      ...defaultMailSettings,
      id: `MS${Date.now()}`,
      name: `Schedule ${forms.length + 1}`,
    }
    setForms((current) => [...current, next])
    setActiveIndex(forms.length)
  }

  function removeSchedule() {
    if (forms.length <= 1) return
    setForms((current) => current.filter((_, index) => index !== activeIndex))
    setActiveIndex((current) => Math.max(0, current - 1))
  }

  return (
    <section className="panel settings-panel mail-settings-panel">
      <PanelTitle title="Mail Reports" action="Add Schedule" onAction={addSchedule} />
      <div className="schedule-tabs">
        {forms.map((item, index) => (
          <button
            key={item.id || index}
            className={index === activeIndex ? 'active' : ''}
            onClick={() => setActiveIndex(index)}
          >
            {item.name || `Schedule ${index + 1}`}
          </button>
        ))}
      </div>
      <div className="mail-toggle-row">
        <div>
          <strong>{form.name || 'Schedule'}</strong>
          <span>{form.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => updateActive((current) => ({ ...current, enabled: event.target.checked }))}
          />
          <i />
        </label>
      </div>
      <div className="mail-control-grid">
        <label>
          Schedule name
          <input
            value={form.name}
            onChange={(event) => updateActive((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          Interval
          <select
            value={form.interval}
            onChange={(event) =>
              updateActive((current) => ({ ...current, interval: event.target.value as MailSettings['interval'] }))
            }
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label>
          Send time
          <input
            type="time"
            value={form.sendTime}
            onChange={(event) => updateActive((current) => ({ ...current, sendTime: event.target.value }))}
          />
        </label>
        <label>
          Report type
          <select
            value={form.reportType}
            onChange={(event) =>
              updateActive((current) => ({ ...current, reportType: event.target.value as MailSettings['reportType'] }))
            }
          >
            <option value="summary">Summary</option>
            <option value="overdue">Overdue</option>
            <option value="full">Full</option>
          </select>
        </label>
      </div>
      <div className="recipient-panel">
        <div className="recipient-panel-title">
          <strong>Recipients</strong>
          <span>{form.recipients.length} selected</span>
        </div>
        <div className="recipient-list">
          {activeUsers.length ? (
            activeUsers.map((member) => (
              <label className="recipient-option" key={member.id}>
                <input
                  type="checkbox"
                  checked={form.recipients.includes(member.id)}
                  onChange={() => toggleRecipient(member.id)}
                />
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </span>
              </label>
            ))
          ) : (
            <div className="empty-card">Add team members with email IDs first.</div>
          )}
        </div>
      </div>
      <div className="mail-footer">
        <span>
          Last sent: {form.lastSentAt ? formatDateTime(form.lastSentAt) : 'Not sent yet'}
          <br />
          Next run: {form.enabled && form.nextRunAt ? formatDateTime(form.nextRunAt) : 'Not scheduled'}
        </span>
        <div>
          <button className="secondary-button" onClick={removeSchedule} disabled={forms.length <= 1}>
            <Trash2 size={17} />
            Remove
          </button>
          <button className="secondary-button" onClick={submitTest} disabled={testing || !form.recipients.length}>
            {testing ? <Loader2 className="spin" size={17} /> : <Bell size={17} />}
            Send Test
          </button>
          <button className="primary-button" onClick={submitSave} disabled={saving}>
            {saving ? <Loader2 className="spin" size={17} /> : <CheckCircle2 size={17} />}
            Save
          </button>
        </div>
      </div>
    </section>
  )
}

function PanelTitle({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      {action && (
        <button className="text-button" onClick={onAction}>
          <Plus size={18} />
          {action}
        </button>
      )}
    </div>
  )
}

function ProjectModal({
  initial,
  team,
  onClose,
  onSave,
}: {
  initial?: Project
  team: TeamMember[]
  onClose: () => void
  onSave: (project: Project) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<Project>(
    initial ?? {
      id: '',
      name: '',
      description: '',
      managerName: '',
      status: 'Not Started',
      startDate: today(),
      endDate: plusDays(30),
      health: 'On Track',
      progress: '0',
      budget: '0',
    },
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    const validationError = validateDateRange('Project', form.startDate, form.endDate)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Project' : 'New Project'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        {formError && <div className="form-error">{formError}</div>}
        <Field label="Project name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Field label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
        <label>
          Manager
          <select value={form.managerName} onChange={(event) => setForm({ ...form, managerName: event.target.value })}>
            <option value="">Select manager</option>
            {team.map((member) => (
              <option key={member.id} value={member.name}>{member.name}</option>
            ))}
          </select>
        </label>
        <Field label="Start date" type="date" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
        <Field label="End date" type="date" value={form.endDate} min={form.startDate} onChange={(endDate) => setForm({ ...form, endDate })} />
        <Field label="Budget" type="number" value={form.budget} onChange={(budget) => setForm({ ...form, budget })} />
        <label>
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {projectStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Health
          <select value={form.health} onChange={(event) => setForm({ ...form, health: event.target.value })}>
            {projectHealth.map((health) => (
              <option key={health}>{health}</option>
            ))}
          </select>
        </label>
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  )
}

function TaskModal({
  projects,
  team,
  modules,
  subModules,
  initial,
  comments,
  onClose,
  onSave,
  onAddComment,
}: {
  projects: Project[]
  team: TeamMember[]
  modules: WorkModule[]
  subModules: SubModule[]
  initial?: TaskItem
  comments: TaskComment[]
  onClose: () => void
  onSave: (task: TaskItem) => Promise<void>
  onAddComment: (task: TaskItem, comment: string) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [form, setForm] = useState<TaskItem>(
    initial ?? {
      id: '',
      projectId: projects[0]?.id ?? '',
      moduleId: '',
      submoduleId: '',
      title: '',
      description: '',
      assignedTo: '',
      priority: 'Medium',
      status: 'Pending',
      dueDate: plusDays(7),
      checklist: '',
      attachmentUrl: '',
    },
  )
  const availableModules = modules.filter((module) => module.projectId === form.projectId)
  const availableSubModules = subModules.filter((submodule) => submodule.moduleId === form.moduleId)
  const minimumDueDate = getTaskParentStartDate(form, projects, modules, subModules)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const validationError = validateDueDate('Task', minimumDueDate, form.dueDate)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  async function submitComment() {
    const value = commentText.trim()
    if (!initial || !value) return
    await onAddComment(initial, value)
    setCommentText('')
  }

  return (
    <Modal title={initial?.id ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        {formError && <div className="form-error">{formError}</div>}
        <label>
          Project
          <select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value, moduleId: '', submoduleId: '' })}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
        <label>
          Module
          <select
            value={form.moduleId}
            onChange={(event) => setForm({ ...form, moduleId: event.target.value, submoduleId: '' })}
          >
            <option value="">No module</option>
            {availableModules.map((module) => (
              <option key={module.id} value={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
        <label>
          Sub module
          <select value={form.submoduleId} onChange={(event) => setForm({ ...form, submoduleId: event.target.value })}>
            <option value="">No sub module</option>
            {availableSubModules.map((submodule) => (
              <option key={submodule.id} value={submodule.id}>{submodule.name}</option>
            ))}
          </select>
        </label>
        <Field label="Task title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <Field label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
        <label>
          Assigned to
          <select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}>
            <option value="">Select member</option>
            {team.map((member) => (
              <option key={member.id} value={member.name}>{member.name}</option>
            ))}
          </select>
        </label>
        <Field label="Due date" type="date" value={form.dueDate} min={minimumDueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
        <Field label="Checklist" value={form.checklist} onChange={(checklist) => setForm({ ...form, checklist })} />
        <Field label="Attachment URL" type="url" value={form.attachmentUrl} onChange={(attachmentUrl) => setForm({ ...form, attachmentUrl })} />
        <label>
          Priority
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {priorities.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {taskStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <FormActions saving={saving} onClose={onClose} />
      </form>
      {initial?.id && (
        <section className="comments-panel">
          <h3>Comments</h3>
          <div className="comment-list">
            {comments.length === 0 ? (
              <small>No comments yet</small>
            ) : (
              comments.map((comment) => (
                <article key={comment.id}>
                  <strong>{comment.userId}</strong>
                  <p>{comment.comment}</p>
                  <small>{String(comment.createdAt).slice(0, 16).replace('T', ' ')}</small>
                </article>
              ))
            )}
          </div>
          <div className="comment-compose">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Add a comment"
            />
            <button type="button" className="primary-button" onClick={submitComment}>
              Add
            </button>
          </div>
        </section>
      )}
    </Modal>
  )
}

function TeamModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: TeamMember
  onClose: () => void
  onSave: (member: TeamMember) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TeamMember>(
    initial ?? {
      id: '',
      name: '',
      email: '',
      mobile: '',
      role: '',
      department: '',
      capacity: '80',
      status: 'Active',
    },
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Team Member' : 'New Team Member'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Field label="Mobile" value={form.mobile} onChange={(mobile) => setForm({ ...form, mobile })} />
        <Field label="Role" value={form.role} onChange={(role) => setForm({ ...form, role })} />
        <Field label="Department" value={form.department} onChange={(department) => setForm({ ...form, department })} />
        <Field label="Capacity %" type="number" value={form.capacity} onChange={(capacity) => setForm({ ...form, capacity })} />
        <label>
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {memberStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  )
}

function MilestoneModal({
  projects,
  team,
  initial,
  onClose,
  onSave,
}: {
  projects: Project[]
  team: TeamMember[]
  initial?: Milestone
  onClose: () => void
  onSave: (milestone: Milestone) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<Milestone>(
    initial ?? {
      id: '',
      projectId: projects[0]?.id ?? '',
      name: '',
      owner: '',
      dueDate: plusDays(14),
      status: 'Pending',
    },
  )
  const projectStartDate = projects.find((project) => project.id === form.projectId)?.startDate || ''

  async function submit(event: FormEvent) {
    event.preventDefault()
    const validationError = validateDueDate('Milestone', projectStartDate, form.dueDate)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Milestone' : 'New Milestone'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        {formError && <div className="form-error">{formError}</div>}
        <label>
          Project
          <select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
        <Field label="Milestone name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <label>
          Owner
          <select value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}>
            <option value="">Select owner</option>
            {team.map((member) => (
              <option key={member.id} value={member.name}>{member.name}</option>
            ))}
          </select>
        </label>
        <Field
          label="Due date"
          type="date"
          value={form.dueDate}
          min={projectStartDate}
          onChange={(dueDate) => setForm({ ...form, dueDate })}
        />
        <label>
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {milestoneStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  )
}

function ProjectDetail({
  project,
  tasks,
  modules,
  subModules,
  milestones,
  onNewModule,
  onEditModule,
  onDeleteModule,
  onNewSubModule,
  onEditSubModule,
  onDeleteSubModule,
  onNewTask,
  onEditTask,
  onClose,
}: {
  project: Project
  tasks: TaskItem[]
  modules: WorkModule[]
  subModules: SubModule[]
  milestones: Milestone[]
  onNewModule: () => void
  onEditModule: (module: WorkModule) => void
  onDeleteModule: (module: WorkModule) => void
  onNewSubModule: (moduleId: string) => void
  onEditSubModule: (submodule: SubModule) => void
  onDeleteSubModule: (submodule: SubModule) => void
  onNewTask: (moduleId: string, submoduleId?: string) => void
  onEditTask: (task: TaskItem) => void
  onClose: () => void
}) {
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [selectedSubModuleId, setSelectedSubModuleId] = useState('')
  const [level, setLevel] = useState<'modules' | 'submodules' | 'tasks'>('modules')
  const selectedModule = modules.find((module) => module.id === selectedModuleId)
  const selectedSubModule = subModules.find((submodule) => submodule.id === selectedSubModuleId)
  const moduleSubModules = subModules.filter((submodule) => submodule.moduleId === selectedModuleId)
  const visibleTasks = tasks.filter((task) =>
    selectedSubModuleId ? task.submoduleId === selectedSubModuleId : task.moduleId === selectedModuleId,
  )
  const taskCountForModule = (moduleId: string) => tasks.filter((task) => task.moduleId === moduleId).length
  const taskCountForSubModule = (submoduleId: string) =>
    tasks.filter((task) => task.submoduleId === submoduleId).length
  const subModuleCountForModule = (moduleId: string) =>
    subModules.filter((submodule) => submodule.moduleId === moduleId).length
  const progressForProject = calculateProjectProgress(project, modules, subModules, tasks)
  const healthForProject = deriveProjectHealth(project, modules, subModules, tasks)
  const progressForModule = (moduleId: string) =>
    calculateModuleProgress(
      modules.find((module) => module.id === moduleId),
      subModules,
      tasks,
    )
  const progressForSubModule = (submoduleId: string) =>
    calculateSubModuleProgress(
      subModules.find((submodule) => submodule.id === submoduleId),
      tasks,
    )

  function openModule(moduleId: string) {
    setSelectedModuleId(moduleId)
    setSelectedSubModuleId('')
    setLevel('submodules')
  }

  function openSubModule(submoduleId: string) {
    setSelectedSubModuleId(submoduleId)
    setLevel('tasks')
  }

  return (
    <Modal title={project.name} onClose={onClose} fullScreen>
      <section className="full-detail">
        <header className="detail-toolbar">
          <div className="breadcrumb">
            <button onClick={() => {
              setSelectedModuleId('')
              setSelectedSubModuleId('')
              setLevel('modules')
            }}>
              {project.name}
            </button>
            {selectedModule && (
              <>
                <ChevronRight size={15} />
                <button onClick={() => {
                  setSelectedSubModuleId('')
                  setLevel('submodules')
                }}>
                  {selectedModule.name}
                </button>
              </>
            )}
            {selectedSubModule && (
              <>
                <ChevronRight size={15} />
                <button onClick={() => setLevel('tasks')}>
                  {selectedSubModule.name}
                </button>
              </>
            )}
          </div>
          <div className="row-actions detail-toolbar-actions">
            <button className="text-button" onClick={() => onNewTask(selectedModuleId, selectedSubModuleId)}>
              <ListChecks size={16} />
              Add Task
            </button>
          </div>
        </header>

        <section className="detail-grid">
          <article>
            <strong>{deriveProjectStatus(progressForProject)}</strong>
            <span>Status</span>
          </article>
          <article>
            <strong>{healthForProject}</strong>
            <span>Health</span>
          </article>
          <article>
            <strong>{modules.length}</strong>
            <span>Modules</span>
          </article>
          <article>
            <strong>{tasks.length}</strong>
            <span>Tasks</span>
          </article>
          <article>
            <strong>{progressForProject}%</strong>
            <span>Progress</span>
          </article>
        </section>

        {level === 'modules' && (
          <section className="detail-section">
            <TableHeading title="Modules" action="Add Module" onAction={onNewModule} />
            <div className="table-wrap">
              <table className="data-table module-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Sub Modules</th>
                    <th>Tasks</th>
                    <th>Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module.id} className="drill-row" onClick={() => openModule(module.id)}>
                      <td>
                        <strong>{module.name}</strong>
                        <small>{module.description || 'No description'}</small>
                      </td>
                      <td>{module.owner || 'Unassigned'}</td>
                      <td><span className="chip">{deriveWorkStatus(progressForModule(module.id))}</span></td>
                      <td><ProgressMeter value={progressForModule(module.id)} /></td>
                      <td>{subModuleCountForModule(module.id)}</td>
                      <td>{taskCountForModule(module.id)}</td>
                      <td>{module.endDate}</td>
	                      <td>
	                        <div className="row-actions">
	                          <button className="icon-button" onClick={(event) => { event.stopPropagation(); openModule(module.id) }}>
	                            <ChevronRight size={16} />
	                          </button>
	                          <button className="icon-button" onClick={(event) => { event.stopPropagation(); onEditModule(module) }}>
	                            <Edit3 size={15} />
                          </button>
                          <button className="icon-button danger" onClick={(event) => { event.stopPropagation(); onDeleteModule(module) }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {modules.length === 0 && <EmptyTable label="No modules created for this project" />}
            </div>
          </section>
        )}

        {level === 'submodules' && selectedModule && (
          <section className="detail-section">
            <TableHeading title={`${selectedModule.name} Sub Modules`} action="Add Sub Module" onAction={() => onNewSubModule(selectedModule.id)} />
            <div className="table-wrap">
              <table className="data-table submodule-table">
                <thead>
                  <tr>
                    <th>Sub Module</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Tasks</th>
                    <th>Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleSubModules.map((submodule) => (
                    <tr key={submodule.id} className="drill-row" onClick={() => openSubModule(submodule.id)}>
                      <td>
                        <strong>{submodule.name}</strong>
                        <small>{submodule.description || 'No description'}</small>
                      </td>
                      <td>{submodule.owner || 'Unassigned'}</td>
                      <td><span className="chip">{deriveWorkStatus(progressForSubModule(submodule.id))}</span></td>
                      <td><ProgressMeter value={progressForSubModule(submodule.id)} /></td>
                      <td>{taskCountForSubModule(submodule.id)}</td>
                      <td>{submodule.endDate}</td>
	                      <td>
	                        <div className="row-actions">
	                          <button className="icon-button" onClick={(event) => { event.stopPropagation(); openSubModule(submodule.id) }}>
	                            <ChevronRight size={16} />
	                          </button>
	                          <button className="icon-button" onClick={(event) => { event.stopPropagation(); onEditSubModule(submodule) }}>
	                            <Edit3 size={15} />
                          </button>
                          <button className="icon-button danger" onClick={(event) => { event.stopPropagation(); onDeleteSubModule(submodule) }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {moduleSubModules.length === 0 && <EmptyTable label="No sub modules created for this module" />}
            </div>
          </section>
        )}

        {level === 'tasks' && selectedModule && (
          <section className="detail-section">
            <TableHeading
              title={selectedSubModule ? `${selectedSubModule.name} Tasks` : `${selectedModule.name} Tasks`}
            />
            <div className="table-wrap">
              <table className="data-table task-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Sub Module</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        <small>{task.description || 'No description'}</small>
                      </td>
                      <td>{subModules.find((submodule) => submodule.id === task.submoduleId)?.name || 'No sub module'}</td>
                      <td>{task.assignedTo || 'Unassigned'}</td>
                      <td><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                      <td><span className="chip">{task.status}</span></td>
                      <td>{task.dueDate}</td>
                      <td>
                        <button className="icon-button" onClick={() => onEditTask(task)}>
                          <Edit3 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleTasks.length === 0 && <EmptyTable label="No tasks linked to this selection" />}
            </div>
          </section>
        )}

        <section className="detail-section related-table">
          <TableHeading title="Milestones" />
          <div className="table-wrap">
            <table className="data-table milestone-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone.id}>
                    <td><strong>{milestone.name}</strong></td>
                    <td>{milestone.owner || 'Unassigned'}</td>
                    <td><span className="chip">{milestone.status}</span></td>
                    <td>{milestone.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {milestones.length === 0 && <EmptyTable label="No milestones for this project" />}
          </div>
        </section>
      </section>
    </Modal>
  )
}

function TableHeading({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="panel-title table-heading">
      <h3>{title}</h3>
      {action && (
        <button className="text-button" onClick={onAction}>
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  )
}

function EmptyTable({ label }: { label: string }) {
  return <div className="empty-table">{label}</div>
}

function ProgressMeter({ value }: { value: number }) {
  return (
    <div className="progress-meter" aria-label={`${value}% complete`}>
      <span>{value}%</span>
      <div>
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function DrilldownPanel({
  title,
  rows,
  onClose,
}: {
  title: string
  rows: string[]
  onClose: () => void
}) {
  return (
    <Modal title={`Drill-down: ${title}`} onClose={onClose}>
      <div className="drill-list">
        {rows.length === 0 ? (
          <article>No records</article>
        ) : (
          rows.map((row, index) => (
            <article key={`${row}-${index}`}>
              <strong>{row}</strong>
            </article>
          ))
        )}
      </div>
    </Modal>
  )
}

function ModuleModal({
  projectId,
  team,
  initial,
  onClose,
  onSave,
}: {
  projectId: string
  team: TeamMember[]
  initial?: WorkModule
  onClose: () => void
  onSave: (module: WorkModule) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<WorkModule>(
    initial ?? {
      id: '',
      projectId,
      name: '',
      description: '',
      owner: '',
      status: 'Pending',
      startDate: today(),
      endDate: plusDays(30),
    },
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    const validationError = validateDateRange('Module', form.startDate, form.endDate)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Module' : 'New Module'} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        {formError && <div className="form-error">{formError}</div>}
        <Field label="Module name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Field label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
        <OwnerSelect value={form.owner} team={team} onChange={(owner) => setForm({ ...form, owner })} />
        <Field label="Start date" type="date" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
        <Field label="End date" type="date" value={form.endDate} min={form.startDate} onChange={(endDate) => setForm({ ...form, endDate })} />
        <StatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} />
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  )
}

function SubModuleModal({
  projectId,
  moduleId,
  team,
  initial,
  onClose,
  onSave,
}: {
  projectId: string
  moduleId: string
  team: TeamMember[]
  initial?: SubModule
  onClose: () => void
  onSave: (submodule: SubModule) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<SubModule>(
    initial ?? {
      id: '',
      projectId,
      moduleId,
      name: '',
      description: '',
      owner: '',
      status: 'Pending',
      startDate: today(),
      endDate: plusDays(14),
    },
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    const validationError = validateDateRange('Sub module', form.startDate, form.endDate)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Sub Module' : 'New Sub Module'} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        {formError && <div className="form-error">{formError}</div>}
        <Field label="Sub module name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Field label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
        <OwnerSelect value={form.owner} team={team} onChange={(owner) => setForm({ ...form, owner })} />
        <Field label="Start date" type="date" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
        <Field label="End date" type="date" value={form.endDate} min={form.startDate} onChange={(endDate) => setForm({ ...form, endDate })} />
        <StatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} />
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  )
}

function OwnerSelect({
  value,
  team,
  onChange,
}: {
  value: string
  team: TeamMember[]
  onChange: (value: string) => void
}) {
  return (
    <label>
      Owner
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select owner</option>
        {team.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}
      </select>
    </label>
  )
}

function StatusSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label>
      Status
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {milestoneStatuses.map((status) => <option key={status}>{status}</option>)}
      </select>
    </label>
  )
}

function Modal({
  title,
  children,
  onClose,
  fullScreen = false,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  fullScreen?: boolean
}) {
  return (
    <div className={`modal-layer ${fullScreen ? 'fullscreen-layer' : ''}`}>
      <button className="modal-backdrop" onClick={onClose} />
      <section className={`modal ${fullScreen ? 'fullscreen-modal' : ''}`}>
        <div className="modal-title">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  type = 'text',
  min,
  onChange,
}: {
  label: string
  value: string
  type?: string
  min?: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <input required type={type} value={value} min={min} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function FormActions({ saving, onClose }: { saving: boolean; onClose: () => void }) {
  return (
    <div className="form-actions">
      <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? <Loader2 className="spin" size={17} /> : <CheckCircle2 size={17} />}
        Save
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <section className="state">
      <Loader2 className="spin" size={34} />
      <h2>Loading workspace</h2>
    </section>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <section className="state error">
      <AlertTriangle size={34} />
      <h2>Unable to load project data</h2>
      <p>{error}</p>
      <button className="primary-button" onClick={onRetry}>
        <RefreshCw size={17} />
        Retry
      </button>
    </section>
  )
}

function buildStats(
  projects: Project[],
  modules: WorkModule[],
  subModules: SubModule[],
  tasks: TaskItem[],
): DashboardStats {
  const todayDate = today()
  const projectProgress = projects.map((project) =>
    calculateProjectProgress(project, modules, subModules, tasks),
  )
  const projectHealthCounts = projectHealth.map((health) => ({
    health,
    count: projects.filter((project) => deriveProjectHealth(project, modules, subModules, tasks) === health).length,
  }))
  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => getProjectDerivedStatus(project, modules, subModules, tasks) === 'Active').length,
    completedProjects: projects.filter((project) => getProjectDerivedStatus(project, modules, subModules, tasks) === 'Completed').length,
    pendingTasks: tasks.filter((task) => !isCompleteStatus(task.status)).length,
    overdueTasks: tasks.filter((task) => !isCompleteStatus(task.status) && task.dueDate < todayDate).length,
    onTrackProjects: projectHealthCounts.find((item) => item.health === 'On Track')?.count ?? 0,
    atRiskProjects: projectHealthCounts.find((item) => item.health === 'At Risk')?.count ?? 0,
    delayedProjects: projectHealthCounts.find((item) => item.health === 'Delayed')?.count ?? 0,
    dueThisWeek: projects.filter((project) => {
      const remaining = daysUntil(project.endDate)
      return remaining >= 0 && remaining <= 7
    }).length,
    dueThisMonth: projects.filter((project) => {
      const remaining = daysUntil(project.endDate)
      return remaining >= 0 && remaining <= 30
    }).length,
    portfolioProgress: projectProgress.length
      ? Math.round(projectProgress.reduce((total, value) => total + value, 0) / projectProgress.length)
      : 0,
  }
}

function getProjectDerivedStatus(
  project: Project,
  modules: WorkModule[],
  subModules: SubModule[],
  tasks: TaskItem[],
) {
  const progress = calculateProjectProgress(project, modules, subModules, tasks)
  if (progress >= 100 || isCompleteStatus(project.status)) return 'Completed'
  if (progress > 0 || project.status === 'In Progress') return 'Active'
  return 'Open'
}

function calculateTaskProgress(tasks: TaskItem[]) {
  if (tasks.length === 0) return 0
  const completed = tasks.filter((task) => isCompleteStatus(task.status)).length
  return Math.round((completed / tasks.length) * 100)
}

function calculateProjectProgress(
  project: Project,
  modules: WorkModule[],
  subModules: SubModule[],
  tasks: TaskItem[],
) {
  const projectModules = modules.filter((module) => module.projectId === project.id)
  if (projectModules.length > 0) {
    const total = projectModules.reduce(
      (sum, module) => sum + calculateModuleProgress(module, subModules, tasks),
      0,
    )
    return Math.round(total / projectModules.length)
  }
  const projectTasks = tasks.filter((task) => task.projectId === project.id)
  if (projectTasks.length > 0) return calculateTaskProgress(projectTasks)
  if (isCompleteStatus(project.status)) return 100
  return statusProgress(project.status)
}

function calculateModuleProgress(
  module: WorkModule | undefined,
  subModules: SubModule[],
  tasks: TaskItem[],
) {
  if (!module) return 0
  const moduleSubModules = subModules.filter((submodule) => submodule.moduleId === module.id)
  if (moduleSubModules.length > 0) {
    const total = moduleSubModules.reduce(
      (sum, submodule) => sum + calculateSubModuleProgress(submodule, tasks),
      0,
    )
    return Math.round(total / moduleSubModules.length)
  }
  const moduleTasks = tasks.filter((task) => task.moduleId === module.id)
  if (moduleTasks.length > 0) return calculateTaskProgress(moduleTasks)
  if (isCompleteStatus(module.status)) return 100
  return statusProgress(module.status)
}

function calculateSubModuleProgress(submodule: SubModule | undefined, tasks: TaskItem[]) {
  if (!submodule) return 0
  const submoduleTasks = tasks.filter((task) => task.submoduleId === submodule.id)
  if (submoduleTasks.length > 0) return calculateTaskProgress(submoduleTasks)
  if (isCompleteStatus(submodule.status)) return 100
  return statusProgress(submodule.status)
}

function isCompleteStatus(status: string) {
  return ['done', 'completed', 'complete'].includes(status.trim().toLowerCase())
}

function statusProgress(status: string) {
  const normalized = status.trim().toLowerCase()
  if (isCompleteStatus(status)) return 100
  if (['in progress', 'review'].includes(normalized)) return 50
  return 0
}

function deriveWorkStatus(progress: number) {
  if (progress >= 100) return 'Completed'
  if (progress > 0) return 'In Progress'
  return 'Pending'
}

function deriveProjectStatus(progress: number) {
  if (progress >= 100) return 'Completed'
  if (progress > 0) return 'In Progress'
  return 'Not Started'
}

function deriveProjectHealth(
  project: Project,
  modules: WorkModule[],
  subModules: SubModule[],
  tasks: TaskItem[],
) {
  const progress = calculateProjectProgress(project, modules, subModules, tasks)
  const projectTasks = tasks.filter((task) => task.projectId === project.id)
  const hasOverdueTask = projectTasks.some(
    (task) => !isCompleteStatus(task.status) && task.dueDate && task.dueDate < today(),
  )
  const remainingDays = daysUntil(project.endDate)

  if (progress >= 100) return 'On Track'
  if (hasOverdueTask || remainingDays < 0) return 'Delayed'
  if (remainingDays <= 7 && progress < 80) return 'At Risk'
  if (remainingDays <= 14 && progress < 60) return 'At Risk'
  return 'On Track'
}

function daysUntil(dateValue: string) {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const target = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY
  const current = new Date(`${today()}T00:00:00`)
  return Math.ceil((target.getTime() - current.getTime()) / 86400000)
}

function validateDateRange(label: string, startDate: string, endDate: string) {
  if (!startDate || !endDate) return ''
  if (endDate < startDate) return `${label} end date cannot be earlier than start date.`
  return ''
}

function validateDueDate(label: string, startDate: string, dueDate: string) {
  if (!startDate || !dueDate) return ''
  if (dueDate < startDate) return `${label} due date cannot be earlier than start date.`
  return ''
}

function getTaskParentStartDate(
  task: TaskItem,
  projects: Project[],
  modules: WorkModule[],
  subModules: SubModule[],
) {
  const submodule = subModules.find((item) => item.id === task.submoduleId)
  if (submodule?.startDate) return submodule.startDate
  const module = modules.find((item) => item.id === task.moduleId)
  if (module?.startDate) return module.startDate
  const project = projects.find((item) => item.id === task.projectId)
  return project?.startDate || ''
}

function upsert<T extends Record<string, string>>(rows: T[], row: T, key: keyof T) {
  const index = rows.findIndex((current) => current[key] === row[key])
  if (index === -1) return [row, ...rows]
  return rows.map((current, currentIndex) => (currentIndex === index ? row : current))
}

function groupCounts(values: string[]) {
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value || 'Unassigned', (counts.get(value || 'Unassigned') ?? 0) + 1))
  return [...counts.entries()].map(([label, value]) => ({ label, value }))
}

function formatActivityLabel(value: string) {
  return (value || 'Activity')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatActivityTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16).replace('T', ' ')
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16).replace('T', ' ')
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function plusDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default App
