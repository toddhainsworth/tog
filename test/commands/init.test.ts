import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as readline from 'node:readline/promises'
import sinon from 'sinon'

import {TogglClient} from '../../src/lib/toggl-client.js'

describe('init', () => {
  // Note: The init command is interactive and difficult to test reliably
  // with the current oclif test framework. These tests are skipped in favor
  // of unit testing the underlying business logic.

  it.skip('is an interactive command - tested via unit tests instead', () => {
    // The init command uses readline for user input, which doesn't work well
    // with oclif's runCommand test helper. The business logic is tested
    // in the config.test.ts, validation.test.ts, and toggl-client.test.ts files.
  })
})
