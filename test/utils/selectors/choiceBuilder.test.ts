/**
 * Tests for choiceBuilder utilities
 */

import { expect } from 'chai'
import {
  buildEntityChoices,
  sortChoicesByPriority,
  type UnifiedEntity,
  type EntityChoice,
  type PriorityScorer,
} from '../../../src/utils/selectors/choiceBuilder.js'
import { TogglClient, TogglProject, TogglTask } from '../../../src/api/client.js'

describe('choiceBuilder', () => {
  const mockWorkspaceId = 12345

  const mockClients: TogglClient[] = [
    { id: 1, name: 'Acme Corporation' },
    { id: 2, name: 'Tech Startup Inc' },
  ]

  const mockProjects: TogglProject[] = [
    {
      id: 101,
      name: 'Website Redesign',
      color: '#ff0000',
      active: true,
      workspace_id: mockWorkspaceId,
      client_id: 1,
      billable: false,
    },
    {
      id: 102,
      name: 'Mobile App',
      color: '#00ff00',
      active: true,
      workspace_id: mockWorkspaceId,
      client_id: 2,
      billable: false,
    },
  ]

  const mockTasks: TogglTask[] = [
    {
      id: 201,
      name: 'Design Homepage',
      project_id: 101,
      workspace_id: mockWorkspaceId,
      active: true,
    },
    { id: 202, name: 'Build API', project_id: 102, workspace_id: mockWorkspaceId, active: true },
  ]

  describe('buildEntityChoices', () => {
    describe('without allowNone', () => {
      it('builds choices with project type prefixes', () => {
        const choices = buildEntityChoices(mockProjects, false)

        expect(choices).to.have.lengthOf(2)
        expect(choices[0].name).to.equal('[Project] Website Redesign')
        expect(choices[0].originalName).to.equal('Website Redesign')
        expect(choices[0].value).to.not.be.null
        expect(choices[0].value?.type).to.equal('project')

        expect(choices[1].name).to.equal('[Project] Mobile App')
        expect(choices[1].originalName).to.equal('Mobile App')
      })

      it('builds choices with client type prefixes', () => {
        const choices = buildEntityChoices(mockClients, false)

        expect(choices).to.have.lengthOf(2)
        expect(choices[0].name).to.equal('[Client] Acme Corporation')
        expect(choices[0].originalName).to.equal('Acme Corporation')
        expect(choices[0].value?.type).to.equal('client')

        expect(choices[1].name).to.equal('[Client] Tech Startup Inc')
      })

      it('builds choices with task type prefixes', () => {
        const choices = buildEntityChoices(mockTasks, false)

        expect(choices).to.have.lengthOf(2)
        expect(choices[0].name).to.equal('[Task] Design Homepage')
        expect(choices[0].originalName).to.equal('Design Homepage')
        expect(choices[0].value?.type).to.equal('task')

        expect(choices[1].name).to.equal('[Task] Build API')
      })

      it('builds choices with mixed entity types', () => {
        const mixedEntities: UnifiedEntity[] = [...mockClients, ...mockProjects, ...mockTasks]
        const choices = buildEntityChoices(mixedEntities, false)

        expect(choices).to.have.lengthOf(6)
        expect(choices[0].name).to.equal('[Client] Acme Corporation')
        expect(choices[2].name).to.equal('[Project] Website Redesign')
        expect(choices[4].name).to.equal('[Task] Design Homepage')
      })

      it('handles empty entities array', () => {
        const choices = buildEntityChoices([], false)

        expect(choices).to.be.an('array').that.is.empty
      })

      it('sets originalName correctly for search filtering', () => {
        const choices = buildEntityChoices(mockProjects, false)

        expect(choices[0].originalName).to.equal('Website Redesign')
        expect(choices[0].name).to.include('Website Redesign')
        expect(choices[0].name).to.include('[Project]')
      })

      it('includes entity in value for type-safe access', () => {
        const choices = buildEntityChoices(mockProjects, false)

        expect(choices[0].value).to.not.be.null
        expect(choices[0].value?.entity).to.deep.equal(mockProjects[0])
      })
    })

    describe('with allowNone', () => {
      it('prepends [None] option when allowNone is true', () => {
        const choices = buildEntityChoices(mockProjects, true)

        expect(choices).to.have.lengthOf(3)
        expect(choices[0].name).to.equal('[None] No project or task')
        expect(choices[0].originalName).to.equal('None')
        expect(choices[0].value).to.be.null
      })

      it('keeps [None] at index 0', () => {
        const mixedEntities: UnifiedEntity[] = [...mockClients, ...mockProjects]
        const choices = buildEntityChoices(mixedEntities, true)

        expect(choices[0].name).to.equal('[None] No project or task')
        expect(choices[1].name).to.equal('[Client] Acme Corporation')
        expect(choices[2].name).to.equal('[Client] Tech Startup Inc')
        expect(choices[3].name).to.equal('[Project] Website Redesign')
      })

      it('does not prepend [None] when allowNone is false', () => {
        const choices = buildEntityChoices(mockProjects, false)

        expect(choices[0].name).to.not.include('[None]')
        expect(choices[0].value).to.not.be.null
      })

      it('handles empty entities with allowNone', () => {
        const choices = buildEntityChoices([], true)

        expect(choices).to.have.lengthOf(1)
        expect(choices[0].name).to.equal('[None] No project or task')
        expect(choices[0].value).to.be.null
      })
    })

    describe('edge cases', () => {
      it('handles entities with empty names', () => {
        const projectWithEmptyName: TogglProject = {
          id: 999,
          name: '',
          color: '#ff0000',
          active: true,
          workspace_id: mockWorkspaceId,
          billable: false,
        }
        const choices = buildEntityChoices([projectWithEmptyName], false)

        expect(choices).to.have.lengthOf(1)
        expect(choices[0].name).to.equal('[Project] ')
        expect(choices[0].originalName).to.equal('')
      })

      it('handles large number of entities', () => {
        const manyProjects: TogglProject[] = Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Project ${i}`,
          color: '#ff0000',
          active: true,
          workspace_id: mockWorkspaceId,
          billable: false,
        }))

        const choices = buildEntityChoices(manyProjects, false)

        expect(choices).to.have.lengthOf(100)
        expect(choices[0].name).to.equal('[Project] Project 0')
        expect(choices[99].name).to.equal('[Project] Project 99')
      })
    })
  })

  describe('sortChoicesByPriority', () => {
    let testChoices: EntityChoice[]

    beforeEach(() => {
      testChoices = buildEntityChoices(mockProjects, false)
    })

    describe('without allowNone', () => {
      it('sorts choices by score descending', () => {
        const scorer: PriorityScorer = entity => {
          if (entity.name === 'Mobile App') return 100
          if (entity.name === 'Website Redesign') return 50
          return 0
        }

        const sorted = sortChoicesByPriority(testChoices, scorer, false)

        expect(sorted[0].originalName).to.equal('Mobile App')
        expect(sorted[1].originalName).to.equal('Website Redesign')
      })

      it('sorts alphabetically for equal scores', () => {
        const scorer: PriorityScorer = () => 50 // All same score

        const mixedEntities: UnifiedEntity[] = [
          { ...mockProjects[0], name: 'Zebra Project' },
          { ...mockProjects[1], name: 'Alpha Project' },
          {
            id: 103,
            name: 'Beta Project',
            color: '#ff0000',
            active: true,
            workspace_id: mockWorkspaceId,
            billable: false,
          },
        ]
        const choices = buildEntityChoices(mixedEntities, false)
        const sorted = sortChoicesByPriority(choices, scorer, false)

        expect(sorted[0].originalName).to.equal('Alpha Project')
        expect(sorted[1].originalName).to.equal('Beta Project')
        expect(sorted[2].originalName).to.equal('Zebra Project')
      })

      it('handles negative scores', () => {
        const scorer: PriorityScorer = entity => {
          if (entity.name === 'Mobile App') return -10
          return 100
        }

        const sorted = sortChoicesByPriority(testChoices, scorer, false)

        expect(sorted[0].originalName).to.equal('Website Redesign')
        expect(sorted[1].originalName).to.equal('Mobile App')
      })

      it('handles zero scores', () => {
        const scorer: PriorityScorer = () => 0

        const sorted = sortChoicesByPriority(testChoices, scorer, false)

        expect(sorted).to.have.lengthOf(2)
        // Should be alphabetically sorted when all scores are 0
        expect(sorted[0].originalName).to.equal('Mobile App')
        expect(sorted[1].originalName).to.equal('Website Redesign')
      })
    })

    describe('with allowNone', () => {
      it('keeps [None] at top when allowNone is true', () => {
        const choicesWithNone = buildEntityChoices(mockProjects, true)
        const scorer: PriorityScorer = () => 100 // High score for all

        const sorted = sortChoicesByPriority(choicesWithNone, scorer, true)

        expect(sorted[0].name).to.equal('[None] No project or task')
        expect(sorted[0].value).to.be.null
      })

      it('sorts remaining choices after [None]', () => {
        const choicesWithNone = buildEntityChoices(mockProjects, true)
        const scorer: PriorityScorer = entity => {
          if (entity.name === 'Mobile App') return 100
          return 50
        }

        const sorted = sortChoicesByPriority(choicesWithNone, scorer, true)

        expect(sorted[0].name).to.equal('[None] No project or task')
        expect(sorted[1].originalName).to.equal('Mobile App')
        expect(sorted[2].originalName).to.equal('Website Redesign')
      })

      it('handles only [None] option', () => {
        const choicesWithNone = buildEntityChoices([], true)
        const scorer: PriorityScorer = () => 100

        const sorted = sortChoicesByPriority(choicesWithNone, scorer, true)

        expect(sorted).to.have.lengthOf(1)
        expect(sorted[0].name).to.equal('[None] No project or task')
      })
    })

    describe('error handling', () => {
      it('throws on unexpected null in entity choices when allowNone is false', () => {
        const invalidChoices: EntityChoice[] = [
          {
            name: '[None] Invalid',
            value: null,
            originalName: 'None',
          },
        ]
        const scorer: PriorityScorer = () => 0

        expect(() => sortChoicesByPriority(invalidChoices, scorer, false)).to.throw(
          'Unexpected null value in entity choices'
        )
      })

      it('throws on unexpected null in rest choices when allowNone is true', () => {
        const invalidChoices: EntityChoice[] = [
          {
            name: '[None] No project or task',
            value: null,
            originalName: 'None',
          },
          {
            name: '[None] Another None',
            value: null,
            originalName: 'None',
          },
        ]
        const scorer: PriorityScorer = () => 0

        expect(() => sortChoicesByPriority(invalidChoices, scorer, true)).to.throw(
          'Unexpected null value in entity choices'
        )
      })
    })

    describe('edge cases', () => {
      it('handles empty choices array', () => {
        const scorer: PriorityScorer = () => 0
        const sorted = sortChoicesByPriority([], scorer, false)

        expect(sorted).to.be.an('array').that.is.empty
      })

      it('handles single choice', () => {
        const singleChoice = buildEntityChoices([mockProjects[0]], false)
        const scorer: PriorityScorer = () => 100

        const sorted = sortChoicesByPriority(singleChoice, scorer, false)

        expect(sorted).to.have.lengthOf(1)
        expect(sorted[0].originalName).to.equal('Website Redesign')
      })

      it('handles very large score differences', () => {
        const scorer: PriorityScorer = entity => {
          if (entity.name === 'Mobile App') return 1000000
          return 1
        }

        const sorted = sortChoicesByPriority(testChoices, scorer, false)

        expect(sorted[0].originalName).to.equal('Mobile App')
        expect(sorted[1].originalName).to.equal('Website Redesign')
      })
    })
  })
})
