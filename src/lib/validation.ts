import {type} from 'arktype'


// Core entity validation schemas
export const TimeEntrySchema = type({
  at: 'string',
  'billable?': 'boolean',
  'client_name?': 'string',
  'description?': 'string',
  duration: 'number',
  'duronly?': 'boolean',
  id: 'number',
  'pid?': 'number', // Legacy project ID
  'project_active?': 'boolean',
  'project_billable?': 'boolean',
  'project_color?': 'string',
  'project_id?': 'number',
  'project_name?': 'string',
  'server_deleted_at?': 'string|null',
  start: 'string',
  'stop?': 'string|null',
  'tag_ids?': 'number[]|null',
  'tags?': 'string[]|null',
  'task_id?': 'number|null',
  'uid?': 'number', // Legacy user ID
  'user_id?': 'number',
  'wid?': 'number', // Legacy workspace ID
  workspace_id: 'number',})

export const WorkspaceSchema = type({
  id: 'number',
  name: 'string',
  'organization_id?': 'number',
})

export const ProjectSchema = type({
  active: 'boolean',
  'client_name?': 'string',
  'color?': 'string',
  id: 'number',
  name: 'string',
  workspace_id: 'number',})

export const TaskSchema = type({
  active: 'boolean',
  id: 'number',
  name: 'string',
  project_id: 'number',})

export const UserSchema = type({
  'email?': 'string',
  'fullname?': 'string',
  id: 'number',
})

// Array schemas - allowing empty arrays and multiple elements
export const WorkspacesArraySchema = type(WorkspaceSchema, '[]')
export const ProjectsArraySchema = type(ProjectSchema, '[]')
export const TasksArraySchema = type(TaskSchema, '[]')

// User input validation
export const WorkspaceSelectionSchema = type(String.raw`string&/^[1-9]\d*$/`)
export const TimerDescriptionSchema = type('string>=1')

// Configuration validation (enhanced version of what's in config.ts)
export const ApiTokenSchema = type('string>=32')
export const WorkspaceIdSchema = type('number>0')
export const ConfigSchema = type({
  apiToken: ApiTokenSchema,
  workspaceId: WorkspaceIdSchema,
})

export type TimeEntry = typeof TimeEntrySchema.infer
export type Workspace = typeof WorkspaceSchema.infer
export type Project = typeof ProjectSchema.infer
export type Task = typeof TaskSchema.infer
export type User = typeof UserSchema.infer