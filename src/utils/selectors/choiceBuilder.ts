/**
 * Choice Builder Utilities - Pure functions for building and sorting selector choices
 *
 * Extracted from UnifiedSelector for testability. These pure functions handle:
 * - Building choices with type prefixes
 * - Sorting choices by priority scores
 * - Managing "None" option placement
 */

import { TogglClient, TogglProject, TogglTask } from '../../api/client.js'

/**
 * Unified entity type combining all possible entities
 */
export type UnifiedEntity = TogglClient | TogglProject | TogglTask

/**
 * Entity type discriminator
 */
export type EntityType = 'client' | 'project' | 'task'

/**
 * Selection result with type information
 */
export interface SelectionResult {
  type: EntityType
  entity: UnifiedEntity
}

/**
 * Internal choice structure for search display
 */
export interface EntityChoice {
  name: string
  value: SelectionResult | null
  description?: string
  originalName: string
}

/**
 * Priority scorer function type
 */
export type PriorityScorer = (entity: UnifiedEntity, type: EntityType) => number

/**
 * Type guard for TogglClient
 */
function isClient(entity: UnifiedEntity): entity is TogglClient {
  return 'name' in entity && !('workspace_id' in entity)
}

/**
 * Type guard for TogglProject
 */
function isProject(entity: UnifiedEntity): entity is TogglProject {
  return 'workspace_id' in entity && 'color' in entity
}

/**
 * Type guard for TogglTask
 */
function isTask(entity: UnifiedEntity): entity is TogglTask {
  return 'workspace_id' in entity && 'project_id' in entity && !('color' in entity)
}

/**
 * Get entity type from unified entity
 */
function getEntityType(entity: UnifiedEntity): EntityType {
  if (isClient(entity)) return 'client'
  if (isProject(entity)) return 'project'
  if (isTask(entity)) return 'task'
  throw new Error('Unknown entity type')
}

/**
 * Get entity name
 */
function getEntityName(entity: UnifiedEntity): string {
  return entity.name
}

/**
 * Get type prefix for display
 */
function getTypePrefix(type: EntityType): string {
  switch (type) {
    case 'client':
      return '[Client]'
    case 'project':
      return '[Project]'
    case 'task':
      return '[Task]'
  }
}

/**
 * Build choices with type prefixes
 *
 * Pure function that converts entities into searchable choices.
 * Optionally prepends a "None" option when allowNone is true.
 *
 * @param entities - Array of Toggl entities (clients, projects, tasks)
 * @param allowNone - Whether to prepend "[None] No project or task" option
 * @returns Array of choices ready for @inquirer/search
 */
export function buildEntityChoices(entities: UnifiedEntity[], allowNone: boolean): EntityChoice[] {
  const entityChoices = entities.map(entity => {
    const type = getEntityType(entity)
    const name = getEntityName(entity)
    const prefix = getTypePrefix(type)

    return {
      name: `${prefix} ${name}`,
      value: { type, entity },
      originalName: name,
    }
  })

  // Prepend "None" option if requested
  if (allowNone) {
    return [
      {
        name: '[None] No project or task',
        value: null,
        originalName: 'None',
      },
      ...entityChoices,
    ]
  }

  return entityChoices
}

/**
 * Sort choices by priority score
 *
 * Pure function that sorts entity choices by a custom priority scorer.
 * When allowNone is true and a "None" option is present at index 0,
 * it remains at the top while other choices are sorted.
 *
 * @param choices - Array of entity choices to sort
 * @param scorer - Function that assigns priority scores to entities
 * @param allowNone - Whether the first choice is a "None" option to preserve
 * @returns Sorted array of choices (higher scores first)
 */
export function sortChoicesByPriority(
  choices: EntityChoice[],
  scorer: PriorityScorer,
  allowNone: boolean
): EntityChoice[] {
  // If "None" option is present, keep it at the top and sort the rest
  if (allowNone && choices.length > 0 && choices[0].value === null) {
    const noneOption = choices[0]
    const restChoices = choices.slice(1)

    const sortedRest = restChoices
      .map(choice => {
        // Type guard: we know restChoices don't contain null values
        if (choice.value === null) {
          throw new Error('Unexpected null value in entity choices')
        }
        return {
          choice,
          score: scorer(choice.value.entity, choice.value.type),
        }
      })
      .sort((a, b) => {
        // Higher scores first
        if (b.score !== a.score) {
          return b.score - a.score
        }
        // Alphabetical for same scores
        return a.choice.originalName.localeCompare(b.choice.originalName)
      })
      .map(({ choice }) => choice)

    return [noneOption, ...sortedRest]
  }

  // No "None" option, sort all choices
  return choices
    .map(choice => {
      // Type guard: choices should not contain null when allowNone is false
      if (choice.value === null) {
        throw new Error('Unexpected null value in entity choices')
      }
      return {
        choice,
        score: scorer(choice.value.entity, choice.value.type),
      }
    })
    .sort((a, b) => {
      // Higher scores first
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Alphabetical for same scores
      return a.choice.originalName.localeCompare(b.choice.originalName)
    })
    .map(({ choice }) => choice)
}
