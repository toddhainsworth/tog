/**
 * Unified Selector - Searchable selection for projects, clients, and tasks
 *
 * Provides a single searchable interface combining multiple entity types with:
 * - Type prefixes for visual distinction ([Client], [Project], [Task])
 * - Name-only search matching (prefixes excluded from search)
 * - Optional priority scoring for custom entity ordering
 * - Caching support for performance
 */

import search from '@inquirer/search'
import { TogglApiClient, TogglClient, TogglProject, TogglTask } from '../../api/client.js'
import {
  buildEntityChoices,
  sortChoicesByPriority,
  type UnifiedEntity,
  type EntityType,
  type SelectionResult,
  type PriorityScorer,
} from './choiceBuilder.js'

// Re-export types for convenience
export type { UnifiedEntity, EntityType, SelectionResult, PriorityScorer }

/**
 * Selection options
 */
export interface SelectEntityOptions {
  includeClients?: boolean
  includeProjects?: boolean
  includeTasks?: boolean
  allowNone?: boolean
  currentProjectId?: number
  currentClientId?: number
  priorityScorer?: PriorityScorer
}

/**
 * Unified Selector Class
 */
export class UnifiedSelector {
  constructor(
    private readonly client: TogglApiClient,
    private readonly workspaceId: number
  ) {}

  /**
   * Select an entity from unified searchable list
   */
  async selectEntity(options: SelectEntityOptions): Promise<SelectionResult | null | undefined> {
    const {
      includeClients = false,
      includeProjects = false,
      includeTasks = false,
      allowNone = false,
      priorityScorer,
    } = options

    if (!includeClients && !includeProjects && !includeTasks) {
      throw new Error('At least one entity type must be included')
    }

    // Fetch all requested entity types
    const allEntities = await this.fetchEntities({
      includeClients,
      includeProjects,
      includeTasks,
    })

    if (allEntities.length === 0) {
      return undefined
    }

    // Convert to choices with type prefixes
    let choices = buildEntityChoices(allEntities, allowNone)

    // Apply priority scoring if provided (but keep "None" at top)
    if (priorityScorer) {
      choices = sortChoicesByPriority(choices, priorityScorer, allowNone)
    }

    // Use @inquirer/search for searchable selection
    const result = await search({
      message: 'Search for a client, project, or task:',
      source: async (term, { signal }) => {
        if (signal.aborted) {
          return []
        }

        // If no term, return all choices
        if (!term) {
          return choices
        }

        // Filter by original name (excluding type prefix)
        const lowerTerm = term.toLowerCase()
        return choices.filter(choice => choice.originalName.toLowerCase().includes(lowerTerm))
      },
    })

    return result
  }

  /**
   * Fetch entities based on options
   */
  private async fetchEntities(options: {
    includeClients: boolean
    includeProjects: boolean
    includeTasks: boolean
  }): Promise<UnifiedEntity[]> {
    const entities: UnifiedEntity[] = []

    const promises: Promise<void>[] = []

    if (options.includeClients) {
      promises.push(
        this.client
          .get<TogglClient[]>('/me/clients')
          .then(clients => {
            entities.push(...clients)
          })
          .catch(() => {
            // Intentionally ignore fetch failures - this allows the selector
            // to work with partial data (e.g., if clients API fails, we can
            // still show projects and tasks). The search UI will simply show
            // fewer options rather than completely failing.
          })
      )
    }

    if (options.includeProjects) {
      promises.push(
        this.client
          .get<TogglProject[]>(`/workspaces/${this.workspaceId}/projects`)
          .then(projects => {
            entities.push(...projects.filter(p => p.active))
          })
          .catch(() => {
            // Intentionally ignore fetch failures - this allows the selector
            // to work with partial data (e.g., if projects API fails, we can
            // still show clients and tasks). The search UI will simply show
            // fewer options rather than completely failing.
          })
      )
    }

    if (options.includeTasks) {
      promises.push(
        this.client
          .get<TogglTask[]>('/me/tasks?meta=true')
          .then(tasks => {
            entities.push(...tasks.filter(t => t.active))
          })
          .catch(() => {
            // Intentionally ignore fetch failures - this allows the selector
            // to work with partial data (e.g., if tasks API fails, we can
            // still show clients and projects). The search UI will simply show
            // fewer options rather than completely failing.
          })
      )
    }

    await Promise.all(promises)

    return entities
  }
}
