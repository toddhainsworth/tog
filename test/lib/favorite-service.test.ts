import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import sinon, { type SinonStub } from 'sinon'

import type { TogglClient } from '../../src/lib/toggl-client.js'
import type { Favorite } from '../../src/lib/validation.js'

import { FavoriteService } from '../../src/lib/favorite-service.js'

describe('FavoriteService', () => {
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let mockContext: { debug: SinonStub; warn: SinonStub }

  const mockFavorites: Favorite[] = [
    { description: 'Daily standup', favorite_id: 1, project_id: 10 },
    { description: 'Code review', favorite_id: 2, project_id: 20 },
    { description: 'Planning meeting', favorite_id: 3, project_id: 10 },
    { description: 'Personal task', favorite_id: 4 },
    { description: 'Bug fixing', favorite_id: 5, project_id: 10 }
  ]

  beforeEach(() => {
    mockClient = {
      getFavorites: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TogglClient>

    mockContext = {
      debug: sinon.stub(),
      warn: sinon.stub()
    }
  })

  describe('static filterFavoritesByProject', () => {
    it('should filter favorites by project ID', () => {
      const projectFavorites = FavoriteService.filterFavoritesByProject(mockFavorites, 10)

      expect(projectFavorites).to.have.length(3)
      expect(projectFavorites.every(f => f.project_id === 10)).to.be.true
    })

    it('should return empty array if no favorites for project', () => {
      const projectFavorites = FavoriteService.filterFavoritesByProject(mockFavorites, 999)

      expect(projectFavorites).to.deep.equal([])
    })
  })

  describe('static filterFavoritesByWorkspace', () => {
    it('should return all favorites (no direct workspace filtering)', () => {
      const workspaceFavorites = FavoriteService.filterFavoritesByWorkspace(mockFavorites, 123)

      expect(workspaceFavorites).to.deep.equal(mockFavorites)
    })
  })

  describe('static findFavoriteByDescriptionOrId', () => {
    it('should find favorite by exact ID', () => {
      const favorite = FavoriteService.findFavoriteByDescriptionOrId(mockFavorites, '2')

      expect(favorite).to.deep.equal({ description: 'Code review', favorite_id: 2, project_id: 20 })
    })

    it('should find favorite by partial description match', () => {
      const favorite = FavoriteService.findFavoriteByDescriptionOrId(mockFavorites, 'standup')

      expect(favorite).to.deep.equal({ description: 'Daily standup', favorite_id: 1, project_id: 10 })
    })

    it('should find favorite by exact description match', () => {
      const favorite = FavoriteService.findFavoriteByDescriptionOrId(mockFavorites, 'Code review')

      expect(favorite).to.deep.equal({ description: 'Code review', favorite_id: 2, project_id: 20 })
    })

    it('should return null if no match found', () => {
      const favorite = FavoriteService.findFavoriteByDescriptionOrId(mockFavorites, 'nonexistent')

      expect(favorite).to.be.null
    })

    it('should prefer exact description match over partial matches', () => {
      const favorites: Favorite[] = [
        { description: 'Meeting', favorite_id: 1 },
        { description: 'Daily meeting', favorite_id: 2 },
        { description: 'Meeting prep', favorite_id: 3 }
      ]

      const favorite = FavoriteService.findFavoriteByDescriptionOrId(favorites, 'meeting')

      expect(favorite).to.deep.equal({ description: 'Meeting', favorite_id: 1 })
    })

    it('should throw error for ambiguous partial matches', () => {
      const favorites: Favorite[] = [
        { description: 'Bug fixing backend', favorite_id: 1 },
        { description: 'Bug fixing frontend', favorite_id: 2 }
      ]

      expect(() => FavoriteService.findFavoriteByDescriptionOrId(favorites, 'bug')).to.throw(
        'Multiple favorites match "bug": Bug fixing backend, Bug fixing frontend. Please be more specific.'
      )
    })

    it('should handle case insensitive matching', () => {
      const favorite = FavoriteService.findFavoriteByDescriptionOrId(mockFavorites, 'STANDUP')

      expect(favorite).to.deep.equal({ description: 'Daily standup', favorite_id: 1, project_id: 10 })
    })

    it('should handle invalid ID strings', () => {
      const favorite = FavoriteService.findFavoriteByDescriptionOrId(mockFavorites, 'abc')

      expect(favorite).to.be.null
    })

    it('should handle favorites without description', () => {
      const favoritesWithUntitled: Favorite[] = [
        { description: 'Valid task', favorite_id: 1 },
        { favorite_id: 2 } as Favorite
      ]

      const result = FavoriteService.findFavoriteByDescriptionOrId(favoritesWithUntitled, 'untitled')
      expect(result).to.be.null
    })
  })

  describe('static findFavoriteById', () => {
    it('should find favorite by ID', () => {
      const favorite = FavoriteService.findFavoriteById(mockFavorites, 2)

      expect(favorite).to.deep.equal({ description: 'Code review', favorite_id: 2, project_id: 20 })
    })

    it('should return null if favorite not found', () => {
      const favorite = FavoriteService.findFavoriteById(mockFavorites, 999)

      expect(favorite).to.be.null
    })

    it('should handle empty array', () => {
      const favorite = FavoriteService.findFavoriteById([], 1)

      expect(favorite).to.be.null
    })
  })

  describe('static getFavorites', () => {
    it('should fetch favorites successfully', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.getFavorites(mockClient, mockContext)

      expect(result).to.deep.equal(mockFavorites)
      expect(mockContext.debug).to.have.been.calledWith('Fetching user favorites')
      expect(mockContext.debug).to.have.been.calledWith('Favorites fetched successfully', { count: 5 })
    })

    it('should return empty array on error', async () => {
      const error = new Error('Network error')
      mockClient.getFavorites.rejects(error)

      const result = await FavoriteService.getFavorites(mockClient, mockContext)

      expect(result).to.deep.equal([])
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch favorites', { error: 'Network error' })
      expect(mockContext.warn).to.have.been.calledWith('Failed to fetch favorites')
    })

    it('should work without context', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.getFavorites(mockClient)

      expect(result).to.deep.equal(mockFavorites)
    })
  })

  describe('static getFavoritesForProject', () => {
    it('should return favorites for valid project', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.getFavoritesForProject(mockClient, 10, mockContext)

      expect(result.favorites).to.have.length(3)
      expect(result.favorites.every(f => f.project_id === 10)).to.be.true
      expect(result.error).to.be.undefined
      expect(mockContext.debug).to.have.been.calledWith('Project favorites fetched', {
        count: 3,
        projectId: 10
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getFavorites.rejects(error)

      const result = await FavoriteService.getFavoritesForProject(mockClient, 10, mockContext)

      expect(result.favorites).to.deep.equal([])
      expect(result.error).to.equal('Failed to get favorites for project: API error')
    })
  })

  describe('static getFavoritesForWorkspace', () => {
    it('should return all favorites for workspace', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.getFavoritesForWorkspace(mockClient, 123, mockContext)

      expect(result.favorites).to.deep.equal(mockFavorites)
      expect(result.error).to.be.undefined
      expect(mockContext.debug).to.have.been.calledWith('Workspace favorites fetched', {
        count: 5,
        workspaceId: 123
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getFavorites.rejects(error)

      const result = await FavoriteService.getFavoritesForWorkspace(mockClient, 123, mockContext)

      expect(result.favorites).to.deep.equal([])
      expect(result.error).to.equal('Failed to get favorites for workspace: API error')
    })
  })

  describe('static getFavoriteStats', () => {
    it('should return favorite statistics', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const stats = await FavoriteService.getFavoriteStats(mockClient, mockContext)

      expect(stats).to.deep.equal({
        byProject: {
          10: 3,
          20: 1
        },
        byWorkspace: {},
        total: 5,
        withoutProject: 1,
        withProject: 4
      })
    })

    it('should handle empty favorites', async () => {
      mockClient.getFavorites.resolves([])

      const stats = await FavoriteService.getFavoriteStats(mockClient, mockContext)

      expect(stats).to.deep.equal({
        byProject: {},
        byWorkspace: {},
        total: 0,
        withoutProject: 0,
        withProject: 0
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('Stats error')
      mockClient.getFavorites.rejects(error)

      const result = await FavoriteService.getFavoriteStats(mockClient, mockContext)

      expect(result.error).to.equal('Failed to get favorite statistics: Stats error')
      expect(result.total).to.equal(0)
      expect(result.withProject).to.equal(0)
      expect(result.withoutProject).to.equal(0)
      expect(result.byProject).to.deep.equal({})
      expect(result.byWorkspace).to.deep.equal({})
    })
  })

  describe('static getFavoritesWithoutProject', () => {
    it('should return favorites without project assignment', () => {
      const orphanedFavorites = FavoriteService.getFavoritesWithoutProject(mockFavorites)

      expect(orphanedFavorites).to.have.length(1)
      expect(orphanedFavorites[0]).to.deep.equal({ description: 'Personal task', favorite_id: 4 })
    })

    it('should return empty array if all favorites have projects', () => {
      const favoritesWithProjects = mockFavorites.filter(f => f.project_id)
      const orphanedFavorites = FavoriteService.getFavoritesWithoutProject(favoritesWithProjects)

      expect(orphanedFavorites).to.deep.equal([])
    })
  })

  describe('static getRecentFavorites', () => {
    it('should return recent favorites sorted by ID descending', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.getRecentFavorites(mockClient, 3, mockContext)

      expect(result.favorites).to.have.length(3)
      expect(result.favorites[0]?.favorite_id).to.equal(5) // Most recent
      expect(result.favorites[1]?.favorite_id).to.equal(4)
      expect(result.favorites[2]?.favorite_id).to.equal(3)
      expect(result.error).to.be.undefined
      expect(mockContext.debug).to.have.been.calledWith('Recent favorites fetched', {
        count: 3,
        limit: 3,
        total: 5
      })
    })

    it('should handle limit larger than available favorites', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.getRecentFavorites(mockClient, 10, mockContext)

      expect(result.favorites).to.have.length(5)
      expect(result.favorites[0]?.favorite_id).to.equal(5)
    })

    it('should use default limit of 10', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.getRecentFavorites(mockClient, undefined, mockContext)

      expect(result.favorites).to.have.length(5) // All available
      expect(mockContext.debug).to.have.been.calledWith('Recent favorites fetched', {
        count: 5,
        limit: 10,
        total: 5
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('Recent error')
      mockClient.getFavorites.rejects(error)

      const result = await FavoriteService.getRecentFavorites(mockClient, 5, mockContext)

      expect(result.favorites).to.deep.equal([])
      expect(result.error).to.equal('Failed to get recent favorites: Recent error')
    })
  })

  describe('static selectFavorite', () => {
    it('should select favorite successfully', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.selectFavorite(mockClient, 'standup', mockContext)

      expect(result).to.deep.equal({
        favorite: { description: 'Daily standup', favorite_id: 1, project_id: 10 },
        success: true
      })
      expect(mockContext.debug).to.have.been.calledWith('Selecting favorite', { input: 'standup' })
      expect(mockContext.debug).to.have.been.calledWith('Favorite selection successful', {
        description: 'Daily standup',
        favoriteId: 1,
        projectId: 10
      })
    })

    it('should fail selection for non-existent favorite', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.selectFavorite(mockClient, 'nonexistent', mockContext)

      expect(result).to.deep.equal({
        error: 'Favorite "nonexistent" not found',
        success: false
      })
    })

    it('should handle empty favorites list', async () => {
      mockClient.getFavorites.resolves([])

      const result = await FavoriteService.selectFavorite(mockClient, 'anything', mockContext)

      expect(result).to.deep.equal({
        error: 'No favorites found. Create some favorites first.',
        success: false
      })
    })

    it('should handle errors during selection', async () => {
      const error = new Error('Selection error')
      mockClient.getFavorites.rejects(error)

      const result = await FavoriteService.selectFavorite(mockClient, 'standup', mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Selection error')
      expect(mockContext.debug).to.have.been.calledWith('Favorite selection failed', {
        error: 'Selection error',
        input: 'standup'
      })
    })

    it('should handle ambiguous matches', async () => {
      const ambiguousFavorites: Favorite[] = [
        { description: 'Bug fixing backend', favorite_id: 1 },
        { description: 'Bug fixing frontend', favorite_id: 2 }
      ]
      mockClient.getFavorites.resolves(ambiguousFavorites)

      const result = await FavoriteService.selectFavorite(mockClient, 'bug', mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.include('Multiple favorites match "bug"')
    })
  })

  describe('static validateFavorite', () => {
    it('should validate existing favorite successfully', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.validateFavorite(mockClient, 2, mockContext)

      expect(result).to.deep.equal({
        favorite: { description: 'Code review', favorite_id: 2, project_id: 20 },
        success: true
      })
      expect(mockContext.debug).to.have.been.calledWith('Favorite validation successful', {
        description: 'Code review',
        favoriteId: 2
      })
    })

    it('should fail validation for invalid favorite ID', async () => {
      const result = await FavoriteService.validateFavorite(mockClient, 0, mockContext)

      expect(result).to.deep.equal({
        error: 'Invalid favorite ID provided',
        success: false
      })
    })

    it('should fail validation for negative favorite ID', async () => {
      const result = await FavoriteService.validateFavorite(mockClient, -1, mockContext)

      expect(result).to.deep.equal({
        error: 'Invalid favorite ID provided',
        success: false
      })
    })

    it('should fail validation for non-existent favorite', async () => {
      mockClient.getFavorites.resolves(mockFavorites)

      const result = await FavoriteService.validateFavorite(mockClient, 999, mockContext)

      expect(result).to.deep.equal({
        error: 'Favorite with ID 999 not found or not accessible',
        success: false
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getFavorites.rejects(error)

      const result = await FavoriteService.validateFavorite(mockClient, 1, mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Failed to validate favorite: API error')
      expect(mockContext.debug).to.have.been.calledWith('Favorite validation failed', {
        error: 'API error',
        favoriteId: 1
      })
    })
  })

  describe('edge cases', () => {
    it('should handle favorites with empty descriptions', () => {
      const favoritesWithEmpty: Favorite[] = [
        { description: '', favorite_id: 1 }
      ]

      const result = FavoriteService.findFavoriteByDescriptionOrId(favoritesWithEmpty, '')
      expect(result).to.deep.equal({ description: '', favorite_id: 1 })
    })

    it('should handle favorites without favorite_id', () => {
      const malformedFavorites = [
        { description: 'Valid favorite', project_id: 10 } as Favorite,
        { description: 'Another favorite', favorite_id: 2 }
      ]

      const result = FavoriteService.findFavoriteById(malformedFavorites, 2)
      expect(result).to.deep.equal({ description: 'Another favorite', favorite_id: 2 })
    })

    it('should handle null values in project statistics', async () => {
      const favoritesWithNulls: Favorite[] = [
        { description: 'Task 1', favorite_id: 1, project_id: 10 },
        { description: 'Task 2', favorite_id: 2, project_id: null },
        { description: 'Task 3', favorite_id: 3 }
      ]
      mockClient.getFavorites.resolves(favoritesWithNulls)

      const stats = await FavoriteService.getFavoriteStats(mockClient, mockContext)

      expect(stats.withProject).to.equal(1)
      expect(stats.withoutProject).to.equal(2)
      expect(stats.byProject).to.deep.equal({ 10: 1 })
    })
  })
});