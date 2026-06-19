import type {
  ActivityItem,
  MailSettings,
  Milestone,
  Project,
  Responsibility,
  SubModule,
  TaskComment,
  TaskItem,
  TeamMember,
  WorkModule,
} from '../types'

const apiUrl = import.meta.env.VITE_APPS_SCRIPT_URL ?? ''

const localProjects: Project[] = [
  {
    id: 'P001',
    name: 'Mobile Banking Revamp',
    description: 'Redesign core journeys and project tracking.',
    managerName: 'Asha Rao',
    status: 'In Progress',
    startDate: '2026-06-01',
    endDate: '2026-08-15',
    health: 'On Track',
    progress: '45',
    budget: '250000',
  },
  {
    id: 'P002',
    name: 'Agent Performance Portal',
    description: 'Dashboard and report automation.',
    managerName: 'Vikram Das',
    status: 'Not Started',
    startDate: '2026-06-20',
    endDate: '2026-07-30',
    health: 'At Risk',
    progress: '10',
    budget: '120000',
  },
  {
    id: 'P003',
    name: 'Sheet API Migration',
    description: 'Move manual reporting to Apps Script APIs.',
    managerName: 'Meera Iyer',
    status: 'Completed',
    startDate: '2026-05-01',
    endDate: '2026-06-05',
    health: 'On Track',
    progress: '100',
    budget: '80000',
  },
]

const localTasks: TaskItem[] = [
  {
    id: 'T001',
    projectId: 'P001',
    moduleId: 'MOD001',
    submoduleId: 'SM001',
    title: 'Finalize dashboard fields',
    description: 'Confirm fields, filters, and report views.',
    assignedTo: 'Rahul Sharma',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-06-19',
    checklist: 'Fields approved\nFilters reviewed',
    attachmentUrl: '',
  },
  {
    id: 'T002',
    projectId: 'P001',
    moduleId: 'MOD001',
    submoduleId: 'SM002',
    title: 'Create Apps Script CRUD API',
    description: 'Backend actions for project management operations.',
    assignedTo: 'Nisha',
    priority: 'Critical',
    status: 'Pending',
    dueDate: '2026-06-16',
    checklist: 'Projects API\nTasks API\nTeam API',
    attachmentUrl: '',
  },
  {
    id: 'T003',
    projectId: 'P003',
    moduleId: 'MOD003',
    submoduleId: '',
    title: 'Test completed report export',
    description: 'Validate export output and formatting.',
    assignedTo: 'Kiran',
    priority: 'Medium',
    status: 'Done',
    dueDate: '2026-06-04',
    checklist: 'Export generated\nReviewed by owner',
    attachmentUrl: '',
  },
]

const localModules: WorkModule[] = [
  {
    id: 'MOD001',
    projectId: 'P001',
    name: 'Customer App',
    description: 'Mobile user journeys and onboarding.',
    owner: 'Asha Rao',
    status: 'In Progress',
    startDate: '2026-06-01',
    endDate: '2026-07-20',
  },
  {
    id: 'MOD002',
    projectId: 'P001',
    name: 'Back Office',
    description: 'Operations screens and approval workflow.',
    owner: 'Rahul Sharma',
    status: 'Pending',
    startDate: '2026-07-01',
    endDate: '2026-08-10',
  },
  {
    id: 'MOD003',
    projectId: 'P003',
    name: 'Reporting API',
    description: 'Apps Script reporting and export services.',
    owner: 'Meera Iyer',
    status: 'Completed',
    startDate: '2026-05-01',
    endDate: '2026-06-05',
  },
]

const localSubModules: SubModule[] = [
  {
    id: 'SM001',
    moduleId: 'MOD001',
    projectId: 'P001',
    name: 'Dashboard',
    description: 'Portfolio overview and charts.',
    owner: 'Rahul Sharma',
    status: 'In Progress',
    startDate: '2026-06-05',
    endDate: '2026-06-30',
  },
  {
    id: 'SM002',
    moduleId: 'MOD001',
    projectId: 'P001',
    name: 'Sheet Sync',
    description: 'Google Sheets data operations.',
    owner: 'Nisha',
    status: 'Pending',
    startDate: '2026-06-10',
    endDate: '2026-07-10',
  },
]

const localResponsibilities: Responsibility[] = [
  {
    id: 'R001',
    level: 'Module',
    referenceId: 'MOD001',
    userId: 'U001',
    role: 'Owner',
    responsibility: 'Delivery ownership',
    backupUserId: 'U004',
    notes: 'Primary escalation point',
  },
]

const localMilestones: Milestone[] = [
  {
    id: 'M001',
    projectId: 'P001',
    name: 'UX sign-off',
    owner: 'Asha Rao',
    dueDate: '2026-07-05',
    status: 'In Progress',
  },
  {
    id: 'M002',
    projectId: 'P002',
    name: 'Requirements baseline',
    owner: 'Vikram Das',
    dueDate: '2026-06-28',
    status: 'Pending',
  },
]

const localActivity: ActivityItem[] = []
const localComments: TaskComment[] = []
let localMailSettings: MailSettings = {
  enabled: false,
  interval: 'daily',
  sendTime: '08:00',
  recipients: [],
  reportType: 'summary',
  lastSentAt: '',
}

const localTeam: TeamMember[] = [
  {
    id: 'U001',
    name: 'Asha Rao',
    email: 'asha.rao@example.com',
    mobile: '+91 90000 10001',
    role: 'Project Manager',
    department: 'Delivery',
    capacity: '80',
    status: 'Active',
  },
  {
    id: 'U002',
    name: 'Vikram Das',
    email: 'vikram.das@example.com',
    mobile: '+91 90000 10002',
    role: 'Product Owner',
    department: 'Banking',
    capacity: '65',
    status: 'Active',
  },
  {
    id: 'U003',
    name: 'Meera Iyer',
    email: 'meera.iyer@example.com',
    mobile: '+91 90000 10003',
    role: 'Automation Lead',
    department: 'Operations',
    capacity: '55',
    status: 'Active',
  },
  {
    id: 'U004',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    mobile: '+91 90000 10004',
    role: 'Frontend Engineer',
    department: 'Engineering',
    capacity: '75',
    status: 'Active',
  },
]

export function isLiveApi() {
  return (
    apiUrl.startsWith('https://script.google.com/macros/s/') &&
    !apiUrl.includes('YOUR') &&
    !apiUrl.includes('REAL_DEPLOYMENT_ID')
  )
}

async function post<T>(action: string, data?: Record<string, unknown>): Promise<T> {
  if (!isLiveApi()) throw new Error('Apps Script URL is not configured.')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({ action, data: data ?? {} }),
      signal: controller.signal,
    })
    const text = await response.text()
    if (!response.ok) throw new Error(`API failed: HTTP ${response.status}`)
    const json = JSON.parse(text)
    if (json.success !== true) throw new Error(json.message ?? 'API request failed')
    return json.data as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Apps Script API timed out. Check the Web App deployment access.', {
        cause: error,
      })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export const api = {
  async getProjects() {
    if (!isLiveApi()) return [...localProjects]
    const rows = await post<Record<string, unknown>[]>('getProjects')
    return rows.map(projectFromRow)
  },

  async getTasks() {
    if (!isLiveApi()) return [...localTasks]
    const rows = await post<Record<string, unknown>[]>('getTasks')
    return rows.map(taskFromRow)
  },

  async getTeam() {
    if (!isLiveApi()) return [...localTeam]
    const rows = await post<Record<string, unknown>[]>('getTeam')
    return rows.map(teamFromRow)
  },

  async getMilestones() {
    if (!isLiveApi()) return [...localMilestones]
    const rows = await post<Record<string, unknown>[]>('getMilestones')
    return rows.map(milestoneFromRow)
  },

  async getModules() {
    if (!isLiveApi()) return [...localModules]
    const rows = await post<Record<string, unknown>[]>('getModules')
    return rows.map(moduleFromRow)
  },

  async getSubModules() {
    if (!isLiveApi()) return [...localSubModules]
    const rows = await post<Record<string, unknown>[]>('getSubModules')
    return rows.map(subModuleFromRow)
  },

  async getResponsibilities() {
    if (!isLiveApi()) return [...localResponsibilities]
    const rows = await post<Record<string, unknown>[]>('getResponsibilities')
    return rows.map(responsibilityFromRow)
  },

  async getActivity() {
    if (!isLiveApi()) return [...localActivity]
    const rows = await post<Record<string, unknown>[]>('getActivity')
    return rows.map(activityFromRow)
  },

  async getComments() {
    if (!isLiveApi()) return [...localComments]
    const rows = await post<Record<string, unknown>[]>('getComments')
    return rows.map(commentFromRow)
  },

  async getMailSettings() {
    if (!isLiveApi()) return { ...localMailSettings }
    const row = await post<Record<string, unknown>>('getMailSettings')
    return mailSettingsFromRow(row)
  },

  async createProject(project: Project) {
    const next = { ...project, id: project.id || makeId('P') }
    if (!isLiveApi()) {
      localProjects.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createProject', projectToRow(next))
    return projectFromRow(row)
  },

  async updateProject(project: Project) {
    if (!isLiveApi()) {
      replace(localProjects, project)
      return project
    }
    await post('updateProject', projectToRow(project))
    return project
  },

  async deleteProject(projectId: string) {
    if (!isLiveApi()) {
      remove(localProjects, projectId)
      return { id: projectId }
    }
    await post('deleteProject', { project_id: projectId })
    return { id: projectId }
  },

  async createTask(task: TaskItem) {
    const next = { ...task, id: task.id || makeId('T') }
    if (!isLiveApi()) {
      localTasks.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createTask', taskToRow(next))
    return taskFromRow(row)
  },

  async updateTask(task: TaskItem) {
    if (!isLiveApi()) {
      replace(localTasks, task)
      return task
    }
    await post('updateTask', taskToRow(task))
    return task
  },

  async deleteTask(taskId: string) {
    if (!isLiveApi()) {
      remove(localTasks, taskId)
      return { id: taskId }
    }
    await post('deleteTask', { task_id: taskId })
    return { id: taskId }
  },

  async createModule(module: WorkModule) {
    const next = { ...module, id: module.id || makeId('MOD') }
    if (!isLiveApi()) {
      localModules.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createModule', moduleToRow(next))
    return moduleFromRow(row)
  },

  async updateModule(module: WorkModule) {
    if (!isLiveApi()) {
      replace(localModules, module)
      return module
    }
    await post('updateModule', moduleToRow(module))
    return module
  },

  async deleteModule(moduleId: string) {
    if (!isLiveApi()) {
      remove(localModules, moduleId)
      return { id: moduleId }
    }
    await post('deleteModule', { module_id: moduleId })
    return { id: moduleId }
  },

  async createSubModule(submodule: SubModule) {
    const next = { ...submodule, id: submodule.id || makeId('SM') }
    if (!isLiveApi()) {
      localSubModules.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createSubModule', subModuleToRow(next))
    return subModuleFromRow(row)
  },

  async updateSubModule(submodule: SubModule) {
    if (!isLiveApi()) {
      replace(localSubModules, submodule)
      return submodule
    }
    await post('updateSubModule', subModuleToRow(submodule))
    return submodule
  },

  async deleteSubModule(submoduleId: string) {
    if (!isLiveApi()) {
      remove(localSubModules, submoduleId)
      return { id: submoduleId }
    }
    await post('deleteSubModule', { submodule_id: submoduleId })
    return { id: submoduleId }
  },

  async createResponsibility(responsibility: Responsibility) {
    const next = { ...responsibility, id: responsibility.id || makeId('R') }
    if (!isLiveApi()) {
      localResponsibilities.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createResponsibility', responsibilityToRow(next))
    return responsibilityFromRow(row)
  },

  async createComment(comment: TaskComment) {
    const next = { ...comment, id: comment.id || makeId('C') }
    if (!isLiveApi()) {
      localComments.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createComment', commentToRow(next))
    return commentFromRow(row)
  },

  async createMilestone(milestone: Milestone) {
    const next = { ...milestone, id: milestone.id || makeId('M') }
    if (!isLiveApi()) {
      localMilestones.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createMilestone', milestoneToRow(next))
    return milestoneFromRow(row)
  },

  async updateMilestone(milestone: Milestone) {
    if (!isLiveApi()) {
      replace(localMilestones, milestone)
      return milestone
    }
    await post('updateMilestone', milestoneToRow(milestone))
    return milestone
  },

  async deleteMilestone(milestoneId: string) {
    if (!isLiveApi()) {
      remove(localMilestones, milestoneId)
      return { id: milestoneId }
    }
    await post('deleteMilestone', { milestone_id: milestoneId })
    return { id: milestoneId }
  },

  async createTeamMember(member: TeamMember) {
    const next = { ...member, id: member.id || makeId('U') }
    if (!isLiveApi()) {
      localTeam.unshift(next)
      return next
    }
    const row = await post<Record<string, unknown>>('createTeamMember', teamToRow(next))
    return teamFromRow(row)
  },

  async updateTeamMember(member: TeamMember) {
    if (!isLiveApi()) {
      replace(localTeam, member)
      return member
    }
    await post('updateTeamMember', teamToRow(member))
    return member
  },

  async deleteTeamMember(memberId: string) {
    if (!isLiveApi()) {
      const index = localTeam.findIndex((member) => member.id === memberId)
      if (index >= 0) localTeam.splice(index, 1)
      return { id: memberId }
    }
    await post('deleteTeamMember', { user_id: memberId })
    return { id: memberId }
  },

  async saveMailSettings(settings: MailSettings) {
    if (!isLiveApi()) {
      localMailSettings = { ...settings }
      return { ...localMailSettings }
    }
    const row = await post<Record<string, unknown>>('saveMailSettings', mailSettingsToRow(settings))
    return mailSettingsFromRow(row)
  },

  async sendProjectSummaryEmail(settings: MailSettings) {
    if (!isLiveApi()) {
      localMailSettings = { ...settings, lastSentAt: new Date().toISOString() }
      return { message: 'Mail simulated', recipients: settings.recipients.length }
    }
    return post<{ message: string; recipients: number; sent_at: string }>(
      'sendProjectSummaryEmail',
      mailSettingsToRow(settings),
    )
  },
}

function projectFromRow(row: Record<string, unknown>): Project {
  return {
    id: String(row.project_id ?? row.id ?? ''),
    name: String(row.project_name ?? row.name ?? ''),
    description: String(row.description ?? ''),
    managerName: String(row.manager_name ?? row.managerName ?? ''),
    status: String(row.status ?? 'Not Started'),
    startDate: String(row.start_date ?? '').slice(0, 10),
    endDate: String(row.end_date ?? '').slice(0, 10),
    health: String(row.health ?? 'On Track'),
    progress: String(row.progress ?? '0'),
    budget: String(row.budget ?? '0'),
  }
}

function taskFromRow(row: Record<string, unknown>): TaskItem {
  return {
    id: String(row.task_id ?? row.id ?? ''),
    projectId: String(row.project_id ?? row.projectId ?? ''),
    moduleId: String(row.module_id ?? row.moduleId ?? ''),
    submoduleId: String(row.submodule_id ?? row.submoduleId ?? ''),
    title: String(row.task_title ?? row.title ?? ''),
    description: String(row.description ?? ''),
    assignedTo: String(row.assigned_to ?? row.assignedTo ?? ''),
    priority: String(row.priority ?? 'Medium'),
    status: String(row.status ?? 'Pending'),
    dueDate: String(row.due_date ?? '').slice(0, 10),
    checklist: String(row.checklist ?? ''),
    attachmentUrl: String(row.attachment_url ?? row.attachmentUrl ?? ''),
  }
}

function moduleFromRow(row: Record<string, unknown>): WorkModule {
  return {
    id: String(row.module_id ?? row.id ?? ''),
    projectId: String(row.project_id ?? row.projectId ?? ''),
    name: String(row.module_name ?? row.name ?? ''),
    description: String(row.description ?? ''),
    owner: String(row.owner ?? ''),
    status: String(row.status ?? 'Pending'),
    startDate: String(row.start_date ?? '').slice(0, 10),
    endDate: String(row.end_date ?? '').slice(0, 10),
  }
}

function subModuleFromRow(row: Record<string, unknown>): SubModule {
  return {
    id: String(row.submodule_id ?? row.id ?? ''),
    moduleId: String(row.module_id ?? row.moduleId ?? ''),
    projectId: String(row.project_id ?? row.projectId ?? ''),
    name: String(row.submodule_name ?? row.name ?? ''),
    description: String(row.description ?? ''),
    owner: String(row.owner ?? ''),
    status: String(row.status ?? 'Pending'),
    startDate: String(row.start_date ?? '').slice(0, 10),
    endDate: String(row.end_date ?? '').slice(0, 10),
  }
}

function responsibilityFromRow(row: Record<string, unknown>): Responsibility {
  return {
    id: String(row.responsibility_id ?? row.id ?? ''),
    level: String(row.level ?? ''),
    referenceId: String(row.reference_id ?? ''),
    userId: String(row.user_id ?? ''),
    role: String(row.role ?? ''),
    responsibility: String(row.responsibility ?? ''),
    backupUserId: String(row.backup_user_id ?? ''),
    notes: String(row.notes ?? ''),
  }
}

function milestoneFromRow(row: Record<string, unknown>): Milestone {
  return {
    id: String(row.milestone_id ?? row.id ?? ''),
    projectId: String(row.project_id ?? row.projectId ?? ''),
    name: String(row.milestone_name ?? row.name ?? ''),
    owner: String(row.owner ?? ''),
    dueDate: String(row.due_date ?? '').slice(0, 10),
    status: String(row.status ?? 'Pending'),
  }
}

function activityFromRow(row: Record<string, unknown>): ActivityItem {
  return {
    id: String(row.log_id ?? row.id ?? ''),
    userId: String(row.user_id ?? ''),
    action: String(row.action ?? ''),
    module: String(row.module ?? ''),
    referenceId: String(row.reference_id ?? ''),
    timestamp: String(row.timestamp ?? ''),
  }
}

function commentFromRow(row: Record<string, unknown>): TaskComment {
  return {
    id: String(row.comment_id ?? row.id ?? ''),
    taskId: String(row.task_id ?? row.taskId ?? ''),
    projectId: String(row.project_id ?? row.projectId ?? ''),
    userId: String(row.user_id ?? row.userId ?? ''),
    comment: String(row.comment ?? ''),
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
  }
}

function teamFromRow(row: Record<string, unknown>): TeamMember {
  return {
    id: String(row.user_id ?? row.id ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    mobile: String(row.mobile ?? ''),
    role: String(row.role ?? ''),
    department: String(row.department ?? ''),
    capacity: String(row.capacity ?? '0'),
    status: String(row.status ?? 'Active'),
  }
}

function mailSettingsFromRow(row: Record<string, unknown>): MailSettings {
  const recipients = Array.isArray(row.recipients)
    ? row.recipients.map(String)
    : String(row.recipients ?? '')
        .split(',')
        .map((recipient) => recipient.trim())
        .filter(Boolean)

  return {
    enabled: row.enabled === true || String(row.enabled ?? '').toUpperCase() === 'TRUE',
    interval: asMailInterval(row.interval),
    sendTime: String(row.send_time ?? row.sendTime ?? '08:00').slice(0, 5),
    recipients,
    reportType: asReportType(row.report_type ?? row.reportType),
    lastSentAt: String(row.last_sent_at ?? row.lastSentAt ?? ''),
  }
}

function projectToRow(project: Project) {
  return {
    project_id: project.id,
    project_name: project.name,
    description: project.description,
    manager_name: project.managerName,
    status: project.status,
    start_date: project.startDate,
    end_date: project.endDate,
    health: project.health,
    progress: project.progress,
    budget: project.budget,
  }
}

function taskToRow(task: TaskItem) {
  return {
    task_id: task.id,
    project_id: task.projectId,
    module_id: task.moduleId,
    submodule_id: task.submoduleId,
    task_title: task.title,
    description: task.description,
    assigned_to: task.assignedTo,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate,
    checklist: task.checklist,
    attachment_url: task.attachmentUrl,
  }
}

function moduleToRow(module: WorkModule) {
  return {
    module_id: module.id,
    project_id: module.projectId,
    module_name: module.name,
    description: module.description,
    owner: module.owner,
    status: module.status,
    start_date: module.startDate,
    end_date: module.endDate,
  }
}

function subModuleToRow(submodule: SubModule) {
  return {
    submodule_id: submodule.id,
    module_id: submodule.moduleId,
    project_id: submodule.projectId,
    submodule_name: submodule.name,
    description: submodule.description,
    owner: submodule.owner,
    status: submodule.status,
    start_date: submodule.startDate,
    end_date: submodule.endDate,
  }
}

function responsibilityToRow(responsibility: Responsibility) {
  return {
    responsibility_id: responsibility.id,
    level: responsibility.level,
    reference_id: responsibility.referenceId,
    user_id: responsibility.userId,
    role: responsibility.role,
    responsibility: responsibility.responsibility,
    backup_user_id: responsibility.backupUserId,
    notes: responsibility.notes,
  }
}

function milestoneToRow(milestone: Milestone) {
  return {
    milestone_id: milestone.id,
    project_id: milestone.projectId,
    milestone_name: milestone.name,
    owner: milestone.owner,
    due_date: milestone.dueDate,
    status: milestone.status,
  }
}

function commentToRow(comment: TaskComment) {
  return {
    comment_id: comment.id,
    task_id: comment.taskId,
    project_id: comment.projectId,
    user_id: comment.userId,
    comment: comment.comment,
    created_at: comment.createdAt,
  }
}

function teamToRow(member: TeamMember) {
  return {
    user_id: member.id,
    name: member.name,
    email: member.email,
    mobile: member.mobile,
    role: member.role,
    department: member.department,
    capacity: member.capacity,
    status: member.status,
  }
}

function mailSettingsToRow(settings: MailSettings) {
  return {
    enabled: settings.enabled,
    interval: settings.interval,
    send_time: settings.sendTime,
    recipients: settings.recipients.join(','),
    report_type: settings.reportType,
    last_sent_at: settings.lastSentAt,
  }
}

function asMailInterval(value: unknown): MailSettings['interval'] {
  return value === 'weekly' || value === 'monthly' ? value : 'daily'
}

function asReportType(value: unknown): MailSettings['reportType'] {
  return value === 'overdue' || value === 'full' ? value : 'summary'
}

function makeId(prefix: string) {
  return `${prefix}${Date.now()}`
}

function replace<T extends { id: string }>(rows: T[], row: T) {
  const index = rows.findIndex((current) => current.id === row.id)
  if (index >= 0) rows[index] = row
}

function remove<T extends { id: string }>(rows: T[], id: string) {
  const index = rows.findIndex((current) => current.id === id)
  if (index >= 0) rows.splice(index, 1)
}
