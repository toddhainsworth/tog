import {expect} from 'chai'

import type {ProjectSummary, TimeEntrySummary} from '../../src/lib/time-utils.js'

import {
  createProjectSummaryTable,
  createTimeEntriesTable,
  formatGrandTotal,
} from '../../src/lib/table-formatter.js'

describe('Table formatter utilities', () => {
  describe('createTimeEntriesTable', () => {
    it('should create a table for time entries', () => {
      const entries: TimeEntrySummary[] = [
        {
          description: 'Working on feature',
          duration: '01:30:00',
          endTime: '10:30',
          projectName: 'Project A',
          startTime: '09:00',
        },
        {
          description: 'Bug fixing',
          duration: '00:45:30',
          endTime: 'Running',
          projectName: 'Project B',
          startTime: '11:00',
        },
      ]

      const result = createTimeEntriesTable(entries)

      expect(result).to.include('Start')
      expect(result).to.include('End')
      expect(result).to.include('Duration')
      expect(result).to.include('Description')
      expect(result).to.include('Project')
      expect(result).to.include('09:00')
      expect(result).to.include('10:30')
      expect(result).to.include('01:30:00')
      expect(result).to.include('Working on feature')
      expect(result).to.include('Project A')
      expect(result).to.include('Running')
      expect(result).to.include('Bug fixing')
    })

    it('should handle entries without projects', () => {
      const entries: TimeEntrySummary[] = [
        {
          description: 'No project task',
          duration: '01:00:00',
          endTime: '10:00',
          startTime: '09:00',
        },
      ]

      const result = createTimeEntriesTable(entries)

      expect(result).to.include('No project task')
      expect(result).to.include('-') // Should show dash for missing project
    })

    it('should handle empty entries array', () => {
      const entries: TimeEntrySummary[] = []

      const result = createTimeEntriesTable(entries)

      expect(result).to.include('Start')
      expect(result).to.include('End')
      expect(result).to.include('Duration')
      expect(result).to.include('Description')
      expect(result).to.include('Project')
    })
  })

  describe('createProjectSummaryTable', () => {
    it('should create a table for project summaries', () => {
      const projects: ProjectSummary[] = [
        {
          formattedDuration: '01:30:00',
          percentage: 60,
          projectName: 'Project A',
          totalSeconds: 5400,
        },
        {
          formattedDuration: '01:00:00',
          percentage: 40,
          projectName: 'Project B',
          totalSeconds: 3600,
        },
      ]

      const result = createProjectSummaryTable(projects)

      expect(result).to.include('Project')
      expect(result).to.include('Duration')
      expect(result).to.include('Percentage')
      expect(result).to.include('Project A')
      expect(result).to.include('01:30:00')
      expect(result).to.include('60%')
      expect(result).to.include('Project B')
      expect(result).to.include('01:00:00')
      expect(result).to.include('40%')
    })

    it('should handle empty projects array', () => {
      const projects: ProjectSummary[] = []

      const result = createProjectSummaryTable(projects)

      expect(result).to.include('Project')
      expect(result).to.include('Duration')
      expect(result).to.include('Percentage')
    })

    it('should handle long project names', () => {
      const projects: ProjectSummary[] = [
        {
          formattedDuration: '01:00:00',
          percentage: 100,
          projectName: 'Very long project name that might exceed column width',
          totalSeconds: 3600,
        },
      ]

      const result = createProjectSummaryTable(projects)

      expect(result).to.include('Very long project name')
      expect(result).to.include('01:00:00')
      expect(result).to.include('100%')
    })
  })

  describe('formatGrandTotal', () => {
    it('should format grand total in HH:MM:SS format', () => {
      expect(formatGrandTotal(0)).to.equal('00:00:00')
      expect(formatGrandTotal(30)).to.equal('00:00:30')
      expect(formatGrandTotal(90)).to.equal('00:01:30')
      expect(formatGrandTotal(3661)).to.equal('01:01:01')
      expect(formatGrandTotal(7200)).to.equal('02:00:00')
    })

    it('should handle large durations', () => {
      expect(formatGrandTotal(36_000)).to.equal('10:00:00')
      expect(formatGrandTotal(86_400)).to.equal('24:00:00')
      expect(formatGrandTotal(90_061)).to.equal('25:01:01')
    })

    it('should pad single digits with zeros', () => {
      expect(formatGrandTotal(5)).to.equal('00:00:05')
      expect(formatGrandTotal(65)).to.equal('00:01:05')
      expect(formatGrandTotal(3605)).to.equal('01:00:05')
    })
  })
})