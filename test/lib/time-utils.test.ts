import {expect} from 'chai'
import {createSandbox} from 'sinon'

import {
  calculateElapsedSeconds,
  formatDuration,
  formatStartTime,
} from '../../src/lib/time-utils.js'

describe('Time utilities', () => {
  let sandbox: ReturnType<typeof createSandbox>

  beforeEach(() => {
    sandbox = createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('formatDuration', () => {
    it('should format duration in HH:MM:SS format', () => {
      expect(formatDuration(0)).to.equal('00:00:00')
      expect(formatDuration(30)).to.equal('00:00:30')
      expect(formatDuration(90)).to.equal('00:01:30')
      expect(formatDuration(3661)).to.equal('01:01:01')
      expect(formatDuration(7200)).to.equal('02:00:00')
    })

    it('should handle large durations', () => {
      expect(formatDuration(36_000)).to.equal('10:00:00')
      expect(formatDuration(86_400)).to.equal('24:00:00')
      expect(formatDuration(90_061)).to.equal('25:01:01')
    })

    it('should pad single digits with zeros', () => {
      expect(formatDuration(5)).to.equal('00:00:05')
      expect(formatDuration(65)).to.equal('00:01:05')
      expect(formatDuration(3605)).to.equal('01:00:05')
    })
  })

  describe('formatStartTime', () => {
    it('should format ISO string to local time', () => {
      const isoString = '2024-01-01T14:30:00.000Z'
      const result = formatStartTime(isoString)

      // The exact output depends on locale/timezone, could be 24h or 12h format
      expect(result).to.match(/^\d{1,2}:\d{2}( (am|pm))?$/i)
    })

    it('should handle different ISO formats', () => {
      const formats = [
        '2024-01-01T09:15:30Z',
        '2024-01-01T09:15:30.123Z',
        '2024-01-01T09:15:30+00:00',
      ]

      for (const format of formats) {
        const result = formatStartTime(format)
        expect(result).to.match(/^\d{1,2}:\d{2}( (am|pm))?$/i)
      }
    })
  })

  describe('calculateElapsedSeconds', () => {
    it('should calculate elapsed time correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z')
      sandbox.useFakeTimers(now.getTime())

      const startTime = '2024-01-01T11:58:30Z' // 1.5 minutes ago
      const elapsed = calculateElapsedSeconds(startTime)
      expect(elapsed).to.equal(90) // 1 minute 30 seconds
    })

    it('should handle same start time as current', () => {
      const now = new Date('2024-01-01T12:00:00Z')
      sandbox.useFakeTimers(now.getTime())

      const startTime = '2024-01-01T12:00:00Z'
      const elapsed = calculateElapsedSeconds(startTime)
      expect(elapsed).to.equal(0)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid date strings gracefully', () => {
      expect(() => formatStartTime('invalid-date')).to.not.throw()
      expect(() => calculateElapsedSeconds('invalid-date')).to.not.throw()
    })

    it('should handle negative durations', () => {
      expect(formatDuration(-30)).to.equal('-1:-1:-30')
    })
  })
})