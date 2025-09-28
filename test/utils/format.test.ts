/**
 * Unit Tests for Format Utilities
 *
 * Tests all formatting functions for correct output, edge cases, and type safety.
 * These utilities are critical for consistent CLI user experience.
 */

import { expect } from 'chai'
import dayjs from 'dayjs'
import {
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatDuration,
  calculateElapsedSeconds,
  formatStartTime,
  formatTimeEntry,
} from '../../src/utils/format.js'

describe('Format Utilities', () => {
  describe('formatSuccess', () => {
    it('should format success messages with checkmark', () => {
      expect(formatSuccess('Timer started')).to.equal('✅ Timer started')
    })

    it('should handle empty messages', () => {
      expect(formatSuccess('')).to.equal('✅ ')
    })

    it('should handle messages with special characters', () => {
      expect(formatSuccess('Test "quoted" & symbols')).to.equal('✅ Test "quoted" & symbols')
    })
  })

  describe('formatError', () => {
    it('should format error messages with X mark', () => {
      expect(formatError('Failed to connect')).to.equal('❌ Failed to connect')
    })

    it('should handle empty messages', () => {
      expect(formatError('')).to.equal('❌ ')
    })

    it('should handle multiline messages', () => {
      expect(formatError('Line 1\nLine 2')).to.equal('❌ Line 1\nLine 2')
    })
  })

  describe('formatWarning', () => {
    it('should format warning messages with warning sign', () => {
      expect(formatWarning('API rate limit reached')).to.equal('⚠️  API rate limit reached')
    })

    it('should handle empty messages', () => {
      expect(formatWarning('')).to.equal('⚠️  ')
    })
  })

  describe('formatInfo', () => {
    it('should format info messages with info icon', () => {
      expect(formatInfo('Connected to workspace')).to.equal('ℹ️  Connected to workspace')
    })

    it('should handle empty messages', () => {
      expect(formatInfo('')).to.equal('ℹ️  ')
    })
  })

  describe('formatDuration', () => {
    describe('human-readable format (default)', () => {
      it('should format seconds only', () => {
        expect(formatDuration(30)).to.equal('30s')
        expect(formatDuration(0)).to.equal('0s')
        expect(formatDuration(59)).to.equal('59s')
      })

      it('should format minutes and seconds', () => {
        expect(formatDuration(90)).to.equal('1m 30s')
        expect(formatDuration(60)).to.equal('1m 0s')
        expect(formatDuration(3599)).to.equal('59m 59s')
      })

      it('should format hours and minutes', () => {
        expect(formatDuration(3600)).to.equal('1h 0m')
        expect(formatDuration(3690)).to.equal('1h 1m')
        expect(formatDuration(7200)).to.equal('2h 0m')
        expect(formatDuration(25200)).to.equal('7h 0m')
      })

      it('should handle negative values (running timers)', () => {
        expect(formatDuration(-30)).to.equal('30s')
        expect(formatDuration(-3690)).to.equal('1h 1m')
      })

      it('should handle zero', () => {
        expect(formatDuration(0)).to.equal('0s')
      })

      it('should handle large durations', () => {
        expect(formatDuration(86400)).to.equal('24h 0m') // 1 day
        expect(formatDuration(90000)).to.equal('25h 0m') // More than 24 hours
      })
    })

    describe('precise format (HH:MM:SS)', () => {
      it('should format with leading zeros', () => {
        expect(formatDuration(30, true)).to.equal('00:00:30')
        expect(formatDuration(90, true)).to.equal('00:01:30')
        expect(formatDuration(3661, true)).to.equal('01:01:01')
      })

      it('should handle hours correctly', () => {
        expect(formatDuration(3600, true)).to.equal('01:00:00')
        expect(formatDuration(7200, true)).to.equal('02:00:00')
        expect(formatDuration(36000, true)).to.equal('10:00:00')
      })

      it('should handle negative values', () => {
        expect(formatDuration(-3661, true)).to.equal('01:01:01')
      })

      it('should handle zero', () => {
        expect(formatDuration(0, true)).to.equal('00:00:00')
      })

      it('should handle large durations', () => {
        expect(formatDuration(86400, true)).to.equal('24:00:00') // 1 day
        expect(formatDuration(359999, true)).to.equal('99:59:59') // Large duration
      })
    })
  })

  describe('calculateElapsedSeconds', () => {
    it('should calculate elapsed time from ISO string', () => {
      const fiveMinutesAgo = dayjs().subtract(5, 'minute').toISOString()
      const elapsed = calculateElapsedSeconds(fiveMinutesAgo)

      // Allow for small timing differences in test execution
      expect(elapsed).to.be.approximately(300, 2) // 5 minutes ± 2 seconds
    })

    it('should handle recent timestamps', () => {
      const twoSecondsAgo = dayjs().subtract(2, 'second').toISOString()
      const elapsed = calculateElapsedSeconds(twoSecondsAgo)

      expect(elapsed).to.be.approximately(2, 1)
    })

    it('should handle future timestamps (negative elapsed)', () => {
      const futureTime = dayjs().add(1, 'minute').toISOString()
      const elapsed = calculateElapsedSeconds(futureTime)

      expect(elapsed).to.be.approximately(-60, 2)
    })

    it('should handle same timestamp', () => {
      const now = dayjs().toISOString()
      const elapsed = calculateElapsedSeconds(now)

      // Should be very close to 0, but allow for small timing differences
      expect(elapsed).to.be.approximately(0, 1)
    })

    it('should handle different date formats', () => {
      const standardISO = '2023-01-01T12:00:00.000Z'
      const shortISO = '2023-01-01T12:00:00Z'

      // Both should work with dayjs
      expect(() => calculateElapsedSeconds(standardISO)).to.not.throw()
      expect(() => calculateElapsedSeconds(shortISO)).to.not.throw()
    })
  })

  describe('formatStartTime', () => {
    it('should format ISO string to HH:mm', () => {
      const isoString = '2023-12-25T14:30:00.000Z'
      const formatted = formatStartTime(isoString)

      // Note: This will be in local timezone, so we test the format pattern
      expect(formatted).to.match(/^\d{2}:\d{2}$/)
    })

    it('should handle different ISO formats', () => {
      const formats = [
        '2023-01-01T09:05:00Z',
        '2023-01-01T09:05:00.000Z',
        '2023-01-01T09:05:00+00:00',
      ]

      formats.forEach(format => {
        const result = formatStartTime(format)
        expect(result).to.match(/^\d{2}:\d{2}$/)
      })
    })

    it('should pad single digits with zeros', () => {
      // Create a time that would need padding (9:05)
      const earlyTime = dayjs().hour(9).minute(5).toISOString()
      const formatted = formatStartTime(earlyTime)

      expect(formatted).to.match(/^\d{2}:\d{2}$/)
      expect(formatted.length).to.equal(5) // HH:MM format
    })
  })

  describe('formatTimeEntry', () => {
    it('should format complete time entry with project', () => {
      const entry = {
        description: 'Working on feature',
        duration: 3600, // 1 hour
        project: { name: 'My Project' },
        start: '2023-12-25T10:00:00Z',
      }

      const formatted = formatTimeEntry(entry)

      expect(formatted).to.include('Working on feature')
      expect(formatted).to.include('[My Project]')
      expect(formatted).to.include('1h 0m')
      expect(formatted).to.include('started')
    })

    it('should format time entry without project', () => {
      const entry = {
        description: 'Solo work',
        duration: 1800, // 30 minutes
        start: '2023-12-25T10:00:00Z',
      }

      const formatted = formatTimeEntry(entry)

      expect(formatted).to.include('Solo work')
      expect(formatted).to.not.include('[')
      expect(formatted).to.include('30m 0s')
      expect(formatted).to.include('started')
    })

    it('should handle empty description', () => {
      const entry = {
        description: '',
        duration: 600, // 10 minutes
        start: '2023-12-25T10:00:00Z',
      }

      const formatted = formatTimeEntry(entry)

      expect(formatted).to.include('10m 0s')
      expect(formatted).to.include('started')
    })

    it('should handle zero duration', () => {
      const entry = {
        description: 'Just started',
        duration: 0,
        start: '2023-12-25T10:00:00Z',
      }

      const formatted = formatTimeEntry(entry)

      expect(formatted).to.include('Just started')
      expect(formatted).to.include('0s')
      expect(formatted).to.include('started')
    })

    it('should handle negative duration (running timer)', () => {
      const entry = {
        description: 'Currently running',
        duration: -1800, // Negative indicates running
        start: '2023-12-25T10:00:00Z',
      }

      const formatted = formatTimeEntry(entry)

      expect(formatted).to.include('Currently running')
      expect(formatted).to.include('30m 0s') // Should show absolute value
      expect(formatted).to.include('started')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle very large numbers in formatDuration', () => {
      const veryLarge = Number.MAX_SAFE_INTEGER
      expect(() => formatDuration(veryLarge)).to.not.throw()

      const result = formatDuration(veryLarge)
      expect(result).to.be.a('string')
      expect(result.length).to.be.greaterThan(0)
    })

    it('should handle invalid date strings gracefully', () => {
      // dayjs will return Invalid Date, but should not throw
      expect(() => formatStartTime('invalid-date')).to.not.throw()
      expect(() => calculateElapsedSeconds('invalid-date')).to.not.throw()
    })

    it('should handle floating point durations', () => {
      expect(formatDuration(90.7)).to.equal('1m 30s') // Should floor the seconds
      expect(formatDuration(90.7, true)).to.equal('00:01:30')
    })
  })
})
