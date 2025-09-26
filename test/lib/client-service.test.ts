import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import sinon, { type SinonStub } from 'sinon'

import type { TogglClient } from '../../src/lib/toggl-client.js'
import type { Client } from '../../src/lib/validation.js'

import { ClientService } from '../../src/lib/client-service.js'

describe('ClientService', () => {
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let mockContext: { debug: SinonStub; warn: SinonStub }

  const mockClients: Client[] = [
    { id: 1, name: 'Acme Corp' },
    { id: 2, name: 'Tech Solutions' },
    { id: 3, name: 'Global Industries' },
    { id: 4, name: 'Local Business' },
    { id: 5, name: 'Acme Healthcare' }
  ]

  const mockProjects = [
    { client_name: 'Acme Corp' },
    { client_name: 'Acme Corp' },
    { client_name: 'Tech Solutions' },
    { client_name: 'Global Industries' },
    { client_name: null },
    { client_name: 'Acme Corp' }
  ]

  beforeEach(() => {
    mockClient = {
      getClients: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TogglClient>

    mockContext = {
      debug: sinon.stub(),
      warn: sinon.stub()
    }
  })

  describe('createClientLookupMap', () => {
    it('should create a case-insensitive lookup map', () => {
      const map = ClientService.createClientLookupMap(mockClients)

      expect(map.get('acme corp')).to.deep.equal({ id: 1, name: 'Acme Corp' })
      expect(map.get('tech solutions')).to.deep.equal({ id: 2, name: 'Tech Solutions' })
      expect(map.size).to.equal(5)
    })

    it('should handle empty array', () => {
      const map = ClientService.createClientLookupMap([])

      expect(map.size).to.equal(0)
    })

    it('should handle clients with mixed case names', () => {
      const mixedCaseClients: Client[] = [
        { id: 1, name: 'UPPERCASE CLIENT' },
        { id: 2, name: 'lowercase client' },
        { id: 3, name: 'MiXeD CaSe ClIeNt' }
      ]

      const map = ClientService.createClientLookupMap(mixedCaseClients)

      expect(map.get('uppercase client')).to.deep.equal({ id: 1, name: 'UPPERCASE CLIENT' })
      expect(map.get('lowercase client')).to.deep.equal({ id: 2, name: 'lowercase client' })
      expect(map.get('mixed case client')).to.deep.equal({ id: 3, name: 'MiXeD CaSe ClIeNt' })
    })
  })

  describe('filterClientsByName', () => {
    it('should filter clients by partial name match', () => {
      const filtered = ClientService.filterClientsByName(mockClients, 'acme')

      expect(filtered).to.have.length(2)
      expect(filtered.map(c => c.name)).to.include('Acme Corp')
      expect(filtered.map(c => c.name)).to.include('Acme Healthcare')
    })

    it('should be case insensitive', () => {
      const filtered = ClientService.filterClientsByName(mockClients, 'TECH')

      expect(filtered).to.have.length(1)
      expect(filtered[0]?.name).to.equal('Tech Solutions')
    })

    it('should return empty array when no matches', () => {
      const filtered = ClientService.filterClientsByName(mockClients, 'nonexistent')

      expect(filtered).to.deep.equal([])
    })

    it('should handle empty client array', () => {
      const filtered = ClientService.filterClientsByName([], 'test')

      expect(filtered).to.deep.equal([])
    })

    it('should match partial strings in middle of names', () => {
      const filtered = ClientService.filterClientsByName(mockClients, 'solutions')

      expect(filtered).to.have.length(1)
      expect(filtered[0]?.name).to.equal('Tech Solutions')
    })
  })

  describe('findClientById', () => {
    it('should find client by ID', () => {
      const client = ClientService.findClientById(mockClients, 2)

      expect(client).to.deep.equal({ id: 2, name: 'Tech Solutions' })
    })

    it('should return null for non-existent ID', () => {
      const client = ClientService.findClientById(mockClients, 999)

      expect(client).to.be.null
    })

    it('should handle empty array', () => {
      const client = ClientService.findClientById([], 1)

      expect(client).to.be.null
    })

    it('should find first matching client when multiple exist (edge case)', () => {
      const duplicateClients: Client[] = [
        { id: 1, name: 'Client A' },
        { id: 1, name: 'Client B' } // Duplicate ID (shouldn't happen in real data)
      ]

      const client = ClientService.findClientById(duplicateClients, 1)

      expect(client?.name).to.equal('Client A')
    })
  })

  describe('findClientByNameOrId', () => {
    it('should find client by exact ID', () => {
      const client = ClientService.findClientByNameOrId(mockClients, '2')

      expect(client).to.deep.equal({ id: 2, name: 'Tech Solutions' })
    })

    it('should find client by partial name match', () => {
      const client = ClientService.findClientByNameOrId(mockClients, 'tech')

      expect(client).to.deep.equal({ id: 2, name: 'Tech Solutions' })
    })

    it('should find client by exact name match', () => {
      const client = ClientService.findClientByNameOrId(mockClients, 'Acme Corp')

      expect(client).to.deep.equal({ id: 1, name: 'Acme Corp' })
    })

    it('should return null for no matches', () => {
      const client = ClientService.findClientByNameOrId(mockClients, 'nonexistent')

      expect(client).to.be.null
    })

    it('should prefer exact name match over partial matches', () => {
      const clients: Client[] = [
        { id: 1, name: 'Corp' },
        { id: 2, name: 'Acme Corp' },
        { id: 3, name: 'Corp Solutions' }
      ]

      const client = ClientService.findClientByNameOrId(clients, 'corp')

      expect(client).to.deep.equal({ id: 1, name: 'Corp' })
    })

    it('should throw error for ambiguous partial matches', () => {
      const clients: Client[] = [
        { id: 1, name: 'Global Tech' },
        { id: 2, name: 'Global Industries' }
      ]

      expect(() => ClientService.findClientByNameOrId(clients, 'global')).to.throw(
        'Multiple clients match "global": Global Tech, Global Industries. Please be more specific.'
      )
    })

    it('should handle case insensitive matching', () => {
      const client = ClientService.findClientByNameOrId(mockClients, 'ACME CORP')

      expect(client).to.deep.equal({ id: 1, name: 'Acme Corp' })
    })

    it('should handle invalid ID strings', () => {
      const client = ClientService.findClientByNameOrId(mockClients, 'abc123')

      expect(client).to.be.null
    })

    it('should handle numeric strings that don\'t match any ID', () => {
      const client = ClientService.findClientByNameOrId(mockClients, '999')

      expect(client).to.be.null
    })
  })

  describe('getClientFromLookupMap', () => {
    it('should get client from lookup map', () => {
      const map = ClientService.createClientLookupMap(mockClients)
      const client = ClientService.getClientFromLookupMap(map, 'Acme Corp')

      expect(client).to.deep.equal({ id: 1, name: 'Acme Corp' })
    })

    it('should be case insensitive', () => {
      const map = ClientService.createClientLookupMap(mockClients)
      const client = ClientService.getClientFromLookupMap(map, 'TECH SOLUTIONS')

      expect(client).to.deep.equal({ id: 2, name: 'Tech Solutions' })
    })

    it('should return undefined for non-existent client', () => {
      const map = ClientService.createClientLookupMap(mockClients)
      const client = ClientService.getClientFromLookupMap(map, 'nonexistent')

      expect(client).to.be.undefined
    })

    it('should handle empty lookup map', () => {
      const map = new Map<string, Client>()
      const client = ClientService.getClientFromLookupMap(map, 'test')

      expect(client).to.be.undefined
    })
  })

  describe('getClients', () => {
    it('should fetch clients successfully', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.getClients(mockClient, mockContext)

      expect(result).to.deep.equal(mockClients)
      expect(mockContext.debug).to.have.been.calledWith('Fetching user clients')
      expect(mockContext.debug).to.have.been.calledWith('Clients fetched successfully', { count: 5 })
    })

    it('should return empty array on error', async () => {
      const error = new Error('Network error')
      mockClient.getClients.rejects(error)

      const result = await ClientService.getClients(mockClient, mockContext)

      expect(result).to.deep.equal([])
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch clients', { error: 'Network error' })
      expect(mockContext.warn).to.have.been.calledWith('Failed to fetch clients')
    })

    it('should work without context', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.getClients(mockClient)

      expect(result).to.deep.equal(mockClients)
    })

    it('should handle non-Error exceptions', async () => {
      mockClient.getClients.rejects('String error')

      const result = await ClientService.getClients(mockClient, mockContext)

      expect(result).to.deep.equal([])
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch clients', { error: 'String error' })
    })
  })

  describe('getClientStats', () => {
    it('should calculate client statistics correctly', async () => {
      mockClient.getClients.resolves(mockClients)

      const stats = await ClientService.getClientStats(mockClient, mockProjects, mockContext)

      expect(stats.totalClients).to.equal(5)
      expect(stats.clientsWithProjects).to.equal(3) // Acme Corp, Tech Solutions, Global Industries
      expect(stats.clientsWithoutProjects).to.equal(2) // Local Business, Acme Healthcare
      expect(stats.averageProjectsPerClient).to.equal(1) // 5 projects / 5 clients = 1
      expect(stats.topClientsByProjects).to.have.length(3) // Only clients with projects
      expect(stats.topClientsByProjects[0]).to.deep.equal({
        name: 'Acme Corp',
        projectCount: 3
      })
      expect(stats.error).to.be.undefined
    })

    it('should handle empty clients', async () => {
      mockClient.getClients.resolves([])

      const stats = await ClientService.getClientStats(mockClient, mockProjects, mockContext)

      expect(stats.totalClients).to.equal(0)
      expect(stats.clientsWithProjects).to.equal(0)
      expect(stats.clientsWithoutProjects).to.equal(0)
      expect(stats.averageProjectsPerClient).to.equal(0)
      expect(stats.topClientsByProjects).to.deep.equal([])
    })

    it('should handle empty projects', async () => {
      mockClient.getClients.resolves(mockClients)

      const stats = await ClientService.getClientStats(mockClient, [], mockContext)

      expect(stats.totalClients).to.equal(5)
      expect(stats.clientsWithProjects).to.equal(0)
      expect(stats.clientsWithoutProjects).to.equal(5)
      expect(stats.averageProjectsPerClient).to.equal(0)
      expect(stats.topClientsByProjects).to.deep.equal([])
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getClients.rejects(error)

      const stats = await ClientService.getClientStats(mockClient, mockProjects, mockContext)

      expect(stats.totalClients).to.equal(0)
      expect(stats.clientsWithProjects).to.equal(0)
      expect(stats.clientsWithoutProjects).to.equal(0)
      expect(stats.averageProjectsPerClient).to.equal(0)
      expect(stats.topClientsByProjects).to.deep.equal([])
      expect(stats.error).to.equal('Failed to get client statistics: API error')
      expect(mockContext.debug).to.have.been.calledWith('Failed to get client statistics', { error: 'API error' })
    })

    it('should sort top clients by project count descending', async () => {
      const clientsWithProjects: Client[] = [
        { id: 1, name: 'Client A' },
        { id: 2, name: 'Client B' },
        { id: 3, name: 'Client C' },
        { id: 4, name: 'Client D' },
        { id: 5, name: 'Client E' },
        { id: 6, name: 'Client F' }
      ]

      const projectsForSorting = [
        { client_name: 'Client A' }, { client_name: 'Client A' }, // 2 projects
        { client_name: 'Client B' }, { client_name: 'Client B' }, { client_name: 'Client B' }, // 3 projects
        { client_name: 'Client C' }, // 1 project
        { client_name: 'Client D' }, { client_name: 'Client D' }, { client_name: 'Client D' },
        { client_name: 'Client D' }, { client_name: 'Client D' }, // 5 projects
        { client_name: 'Client E' }, { client_name: 'Client E' }, { client_name: 'Client E' },
        { client_name: 'Client E' } // 4 projects
        // Client F has 0 projects
      ]

      mockClient.getClients.resolves(clientsWithProjects)

      const stats = await ClientService.getClientStats(mockClient, projectsForSorting, mockContext)

      expect(stats.topClientsByProjects).to.have.length(5) // Top 5 limit
      expect(stats.topClientsByProjects[0]).to.deep.equal({
        name: 'Client D',
        projectCount: 5
      })
      expect(stats.topClientsByProjects[1]).to.deep.equal({
        name: 'Client E',
        projectCount: 4
      })
      expect(stats.topClientsByProjects[2]).to.deep.equal({
        name: 'Client B',
        projectCount: 3
      })
      expect(stats.topClientsByProjects[3]).to.deep.equal({
        name: 'Client A',
        projectCount: 2
      })
      expect(stats.topClientsByProjects[4]).to.deep.equal({
        name: 'Client C',
        projectCount: 1
      })
    })

    it('should round average to 2 decimal places', async () => {
      const testClients: Client[] = [
        { id: 1, name: 'Client A' },
        { id: 2, name: 'Client B' },
        { id: 3, name: 'Client C' }
      ]

      const testProjects = [
        { client_name: 'Client A' },
        { client_name: 'Client A' }
      ]

      mockClient.getClients.resolves(testClients)

      const stats = await ClientService.getClientStats(mockClient, testProjects, mockContext)

      // 2 projects / 3 clients = 0.6666... -> should round to 0.67
      expect(stats.averageProjectsPerClient).to.equal(0.67)
    })
  })

  describe('getClientsWithProjectCounts', () => {
    it('should count projects correctly for each client', () => {
      const result = ClientService.getClientsWithProjectCounts(mockClients, mockProjects)

      expect(result).to.have.length(5)

      const acmeCorpResult = result.find(r => r.client.name === 'Acme Corp')
      expect(acmeCorpResult?.projectCount).to.equal(3)

      const techSolutionsResult = result.find(r => r.client.name === 'Tech Solutions')
      expect(techSolutionsResult?.projectCount).to.equal(1)

      const globalIndustriesResult = result.find(r => r.client.name === 'Global Industries')
      expect(globalIndustriesResult?.projectCount).to.equal(1)

      const localBusinessResult = result.find(r => r.client.name === 'Local Business')
      expect(localBusinessResult?.projectCount).to.equal(0)

      const acmeHealthcareResult = result.find(r => r.client.name === 'Acme Healthcare')
      expect(acmeHealthcareResult?.projectCount).to.equal(0)
    })

    it('should handle empty clients array', () => {
      const result = ClientService.getClientsWithProjectCounts([], mockProjects)

      expect(result).to.deep.equal([])
    })

    it('should handle empty projects array', () => {
      const result = ClientService.getClientsWithProjectCounts(mockClients, [])

      expect(result).to.have.length(5)
      expect(result.every(r => r.projectCount === 0)).to.be.true
    })

    it('should handle projects with null client_name', () => {
      const projectsWithNulls = [
        { client_name: 'Acme Corp' },
        { client_name: null },
        { client_name: 'Tech Solutions' },
        { client_name: null }
      ]

      const result = ClientService.getClientsWithProjectCounts(mockClients, projectsWithNulls)

      const acmeCorpResult = result.find(r => r.client.name === 'Acme Corp')
      expect(acmeCorpResult?.projectCount).to.equal(1)

      const techSolutionsResult = result.find(r => r.client.name === 'Tech Solutions')
      expect(techSolutionsResult?.projectCount).to.equal(1)

      // Other clients should have 0 projects
      const otherResults = result.filter(r => !['Acme Corp', 'Tech Solutions'].includes(r.client.name))
      expect(otherResults.every(r => r.projectCount === 0)).to.be.true
    })

    it('should handle projects with undefined client_name', () => {
      const projectsWithUndefined = [
        { client_name: 'Acme Corp' },
        { client_name: undefined },
        { client_name: 'Tech Solutions' }
      ]

      const result = ClientService.getClientsWithProjectCounts(mockClients, projectsWithUndefined)

      const acmeCorpResult = result.find(r => r.client.name === 'Acme Corp')
      expect(acmeCorpResult?.projectCount).to.equal(1)

      const techSolutionsResult = result.find(r => r.client.name === 'Tech Solutions')
      expect(techSolutionsResult?.projectCount).to.equal(1)
    })
  })

  describe('selectClient', () => {
    it('should select client successfully by name', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.selectClient(mockClient, 'acme', mockContext)

      expect(result.success).to.be.true
      expect(result.client).to.deep.equal({ id: 1, name: 'Acme Corp' })
      expect(result.error).to.be.undefined
      expect(mockContext.debug).to.have.been.calledWith('Selecting client', { input: 'acme' })
      expect(mockContext.debug).to.have.been.calledWith('Client selection successful', {
        clientId: 1,
        clientName: 'Acme Corp'
      })
    })

    it('should select client successfully by ID', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.selectClient(mockClient, '2', mockContext)

      expect(result.success).to.be.true
      expect(result.client).to.deep.equal({ id: 2, name: 'Tech Solutions' })
    })

    it('should fail when no clients exist', async () => {
      mockClient.getClients.resolves([])

      const result = await ClientService.selectClient(mockClient, 'test', mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('No clients found in this workspace')
      expect(result.client).to.be.undefined
    })

    it('should fail when client not found', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.selectClient(mockClient, 'nonexistent', mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Client "nonexistent" not found')
      expect(result.client).to.be.undefined
    })

    it('should handle ambiguous matches', async () => {
      const ambiguousClients: Client[] = [
        { id: 1, name: 'Global Tech' },
        { id: 2, name: 'Global Industries' }
      ]
      mockClient.getClients.resolves(ambiguousClients)

      const result = await ClientService.selectClient(mockClient, 'global', mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Multiple clients match "global": Global Tech, Global Industries. Please be more specific.')
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getClients.rejects(error)

      const result = await ClientService.selectClient(mockClient, 'test', mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('API error')
      expect(mockContext.debug).to.have.been.calledWith('Client selection failed', {
        error: 'API error',
        input: 'test'
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockClient.getClients.rejects('String error')

      const result = await ClientService.selectClient(mockClient, 'test', mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('String error')
    })
  })

  describe('sortClientsByName', () => {
    it('should sort clients alphabetically by name', () => {
      const unsortedClients: Client[] = [
        { id: 3, name: 'Zebra Corp' },
        { id: 1, name: 'Alpha Industries' },
        { id: 2, name: 'Beta Solutions' }
      ]

      const sorted = ClientService.sortClientsByName(unsortedClients)

      expect(sorted.map(c => c.name)).to.deep.equal([
        'Alpha Industries',
        'Beta Solutions',
        'Zebra Corp'
      ])
    })

    it('should not mutate original array', () => {
      const original = [...mockClients]
      const sorted = ClientService.sortClientsByName(mockClients)

      expect(mockClients).to.deep.equal(original)
      expect(sorted).to.not.equal(mockClients) // Different array reference
    })

    it('should handle empty array', () => {
      const sorted = ClientService.sortClientsByName([])

      expect(sorted).to.deep.equal([])
    })

    it('should handle single client', () => {
      const singleClient = [{ id: 1, name: 'Single Client' }]
      const sorted = ClientService.sortClientsByName(singleClient)

      expect(sorted).to.deep.equal([{ id: 1, name: 'Single Client' }])
    })

    it('should handle case-insensitive sorting', () => {
      const mixedCaseClients: Client[] = [
        { id: 1, name: 'zebra corp' },
        { id: 2, name: 'Alpha Industries' },
        { id: 3, name: 'beta Solutions' }
      ]

      const sorted = ClientService.sortClientsByName(mixedCaseClients)

      expect(sorted.map(c => c.name)).to.deep.equal([
        'Alpha Industries',
        'beta Solutions',
        'zebra corp'
      ])
    })
  })

  describe('validateClient', () => {
    it('should validate existing client successfully', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.validateClient(mockClient, 2, mockContext)

      expect(result.success).to.be.true
      expect(result.client).to.deep.equal({ id: 2, name: 'Tech Solutions' })
      expect(result.error).to.be.undefined
      expect(mockContext.debug).to.have.been.calledWith('Client validation successful', {
        clientId: 2,
        clientName: 'Tech Solutions'
      })
    })

    it('should fail validation for invalid client ID (0)', async () => {
      const result = await ClientService.validateClient(mockClient, 0, mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Invalid client ID provided')
      expect(result.client).to.be.undefined
    })

    it('should fail validation for invalid client ID (negative)', async () => {
      const result = await ClientService.validateClient(mockClient, -1, mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Invalid client ID provided')
    })

    it('should fail validation for non-existent client', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.validateClient(mockClient, 999, mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Client with ID 999 not found or not accessible')
      expect(result.client).to.be.undefined
    })

    it('should handle API errors during validation', async () => {
      const error = new Error('API error')
      mockClient.getClients.rejects(error)

      const result = await ClientService.validateClient(mockClient, 1, mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Failed to validate client: API error')
      expect(mockContext.debug).to.have.been.calledWith('Client validation failed', {
        clientId: 1,
        error: 'API error'
      })
    })

    it('should handle non-Error exceptions during validation', async () => {
      mockClient.getClients.rejects('String error')

      const result = await ClientService.validateClient(mockClient, 1, mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Failed to validate client: String error')
    })

    it('should work without context', async () => {
      mockClient.getClients.resolves(mockClients)

      const result = await ClientService.validateClient(mockClient, 1)

      expect(result.success).to.be.true
      expect(result.client).to.deep.equal({ id: 1, name: 'Acme Corp' })
    })
  })

  describe('edge cases', () => {
    it('should handle clients with empty names', () => {
      const clientsWithEmptyNames: Client[] = [
        { id: 1, name: '' },
        { id: 2, name: 'Normal Client' }
      ]

      const result = ClientService.findClientByNameOrId(clientsWithEmptyNames, '')
      expect(result).to.deep.equal({ id: 1, name: '' })

      const filtered = ClientService.filterClientsByName(clientsWithEmptyNames, 'normal')
      expect(filtered).to.have.length(1)
      expect(filtered[0]?.name).to.equal('Normal Client')
    })

    it('should handle clients with special characters in names', () => {
      const specialClients: Client[] = [
        { id: 1, name: 'Client & Co.' },
        { id: 2, name: 'Tech-Solutions Inc.' },
        { id: 3, name: 'Global (Holdings)' }
      ]

      const result1 = ClientService.findClientByNameOrId(specialClients, 'client & co')
      expect(result1?.name).to.equal('Client & Co.')

      const result2 = ClientService.filterClientsByName(specialClients, 'tech-')
      expect(result2).to.have.length(1)
      expect(result2[0]?.name).to.equal('Tech-Solutions Inc.')

      const result3 = ClientService.findClientByNameOrId(specialClients, '(holdings)')
      expect(result3?.name).to.equal('Global (Holdings)')
    })

    it('should handle very long client names', () => {
      const longName = 'A'.repeat(1000)
      const longClients: Client[] = [
        { id: 1, name: longName },
        { id: 2, name: 'Short' }
      ]

      const result = ClientService.findClientById(longClients, 1)
      expect(result?.name).to.equal(longName)

      const map = ClientService.createClientLookupMap(longClients)
      expect(map.get(longName.toLowerCase())).to.deep.equal({ id: 1, name: longName })
    })

    it('should handle duplicate client names in different contexts', () => {
      const duplicateNames: Client[] = [
        { id: 1, name: 'Acme' },
        { id: 2, name: 'Acme' }
      ]

      // Should find the first one by ID
      const byId = ClientService.findClientById(duplicateNames, 2)
      expect(byId).to.deep.equal({ id: 2, name: 'Acme' })

      // Should find the first one by name
      const byName = ClientService.findClientByNameOrId(duplicateNames, 'acme')
      expect(byName).to.deep.equal({ id: 1, name: 'Acme' })
    })

    it('should handle numeric-like client names', () => {
      const numericNameClients: Client[] = [
        { id: 1, name: '123 Industries' },
        { id: 123, name: 'Real Client' }
      ]

      // Should find by exact ID first
      const result1 = ClientService.findClientByNameOrId(numericNameClients, '123')
      expect(result1).to.deep.equal({ id: 123, name: 'Real Client' })

      // Should find by partial name if ID doesn't exist
      const result2 = ClientService.findClientByNameOrId(numericNameClients, '456')
      expect(result2).to.be.null
    })
  })
});