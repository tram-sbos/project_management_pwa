export type SectionKey =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'milestones'
  | 'team'
  | 'reports'
  | 'settings'

export type Project = {
  id: string
  name: string
  description: string
  managerName: string
  status: string
  startDate: string
  endDate: string
  health: string
  progress: string
  budget: string
}

export type TaskItem = {
  id: string
  projectId: string
  moduleId: string
  submoduleId: string
  title: string
  description: string
  assignedTo: string
  priority: string
  status: string
  dueDate: string
  checklist: string
  attachmentUrl: string
}

export type WorkModule = {
  id: string
  projectId: string
  name: string
  description: string
  owner: string
  status: string
  startDate: string
  endDate: string
}

export type SubModule = {
  id: string
  moduleId: string
  projectId: string
  name: string
  description: string
  owner: string
  status: string
  startDate: string
  endDate: string
}

export type Responsibility = {
  id: string
  level: string
  referenceId: string
  userId: string
  role: string
  responsibility: string
  backupUserId: string
  notes: string
}

export type TeamMember = {
  id: string
  name: string
  email: string
  mobile: string
  role: string
  department: string
  capacity: string
  status: string
}

export type Milestone = {
  id: string
  projectId: string
  name: string
  owner: string
  dueDate: string
  status: string
}

export type ActivityItem = {
  id: string
  userId: string
  action: string
  module: string
  referenceId: string
  timestamp: string
}

export type TaskComment = {
  id: string
  taskId: string
  projectId: string
  userId: string
  comment: string
  createdAt: string
}

export type MailInterval = 'daily' | 'weekly' | 'monthly'

export type MailReportType = 'summary' | 'overdue' | 'full'

export type MailSettings = {
  enabled: boolean
  interval: MailInterval
  sendTime: string
  recipients: string[]
  reportType: MailReportType
  lastSentAt: string
}

export type DashboardStats = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  pendingTasks: number
  overdueTasks: number
  onTrackProjects: number
  atRiskProjects: number
  delayedProjects: number
  dueThisWeek: number
  dueThisMonth: number
  portfolioProgress: number
}
