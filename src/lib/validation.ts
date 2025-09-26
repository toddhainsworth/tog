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
  'project_id?': 'number|null',
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

export const ClientSchema = type({
  id: 'number',
  name: 'string',
})

export const UserSchema = type({
  'email?': 'string',
  'fullname?': 'string',
  id: 'number',
})

// Array schemas - allowing empty arrays and multiple elements
export const WorkspacesArraySchema = type(WorkspaceSchema, '[]')
export const ProjectsArraySchema = type(ProjectSchema, '[]')
export const TasksArraySchema = type(TaskSchema, '[]')
export const ClientsArraySchema = type(ClientSchema, '[]')
export const TimeEntriesArraySchema = type(TimeEntrySchema, '[]')

// User input validation
// eslint-disable-next-line unicorn/prefer-string-raw
export const WorkspaceSelectionSchema = type('string&/^[1-9]\\d*$/')
export const TimerDescriptionSchema = type('string>=1')
export const SearchQuerySchema = type('string>=1')

// Configuration validation (enhanced version of what's in config.ts)
export const ApiTokenSchema = type('string>=32')
export const WorkspaceIdSchema = type('number>0')
export const ConfigSchema = type({
  apiToken: ApiTokenSchema,
  workspaceId: WorkspaceIdSchema,
})

// Search validation schemas
export const SearchTimeEntriesPayloadSchema = type({
  'description?': 'string',
  'end_date?': 'string',
  'page_size?': 'number>0',
  'start_date?': 'string',
})

// Reports API returns a different structure with grouped entries
export const ReportsTimeEntrySchema = type({
  at: 'string',
  'at_tz?': 'string',
  id: 'number',
  seconds: 'number',
  start: 'string',
  stop: 'string|null',
  'time_end?': 'string|null',
  'time_start?': 'string',
  'workspace_id?': 'number',
})

export const ReportsGroupedEntrySchema = type({
  'billable?': 'boolean',
  'billable_amount_in_cents?': 'number|null',
  'currency?': 'string',
  'description?': 'string',
  'hourly_rate_in_cents?': 'number|null',
  'project_id?': 'number|null',
  row_number: 'number',
  'tag_ids?': 'number[]|null',
  'task_id?': 'number|null',
  time_entries: type(ReportsTimeEntrySchema, '[]'),
  user_id: 'number',
  'username?': 'string',
})

export const ReportsSearchResponseSchema = type(ReportsGroupedEntrySchema, '[]')

// Favorite schema
export const FavoriteSchema = type({
  'billable?': 'boolean',
  'client_name?': 'string',
  'created_at?': 'string',
  'deleted_at?': 'string|null',
  'description?': 'string',
  'favorite_id?': 'number',
  'permissions?': 'string[]|null',
  'project_active?': 'boolean',
  'project_billable?': 'boolean',
  'project_color?': 'string',
  'project_id?': 'number|null',
  'project_name?': 'string',
  'public?': 'boolean',
  'rank?': 'number',
  'tag_ids?': 'number[]|null',
  'tags?': 'string[]|null',
  'task_id?': 'number|null',
  'task_name?': 'string',
})

export const FavoritesArraySchema = type(FavoriteSchema, '[]')

export type TimeEntry = typeof TimeEntrySchema.infer
export type Workspace = typeof WorkspaceSchema.infer
export type Project = typeof ProjectSchema.infer
export type Task = typeof TaskSchema.infer
export type Client = typeof ClientSchema.infer
export type User = typeof UserSchema.infer
export type Favorite = typeof FavoriteSchema.infer