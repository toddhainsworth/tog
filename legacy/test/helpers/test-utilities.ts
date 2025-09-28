import { createStubInstance, type SinonStubbedInstance } from 'sinon'

import type { Project, Task, TimeEntry } from '../../src/lib/validation.js'

import { TogglClient } from '../../src/lib/toggl-client.js'

/**
 * Type guard for Error objects
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Helper to create properly typed TogglClient mock using Sinon's createStubInstance
 */
export function createMockTogglClient(): SinonStubbedInstance<TogglClient> {
  return createStubInstance(TogglClient)
}

/**
 * Mock data factories for tests
 */
export const MockData = {
  project(overrides: Partial<Project> = {}): Project {
    return {
      active: true,
      id: 1,
      name: 'Test Project',
      workspace_id: 123,
      ...overrides
    }
  },

  task(overrides: Partial<Task> = {}): Task {
    return {
      active: true,
      id: 10,
      name: 'Test Task',
      project_id: 1,
      ...overrides
    }
  },

  timeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
    return {
      at: '2023-01-01T11:00:00Z',
      description: 'Test entry',
      duration: 3600,
      id: 100,
      project_id: 1,
      start: '2023-01-01T10:00:00Z',
      stop: '2023-01-01T11:00:00Z',
      tags: [],
      task_id: 10,
      workspace_id: 123,
      ...overrides
    }
  }
}