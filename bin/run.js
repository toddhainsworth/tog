#!/usr/bin/env node

/**
 * Binary entry point for the tog CLI
 *
 * This script loads and executes the compiled CLI application.
 * Much simpler than the oclif equivalent.
 */

import('../dist/cli.js').catch((error) => {
  console.error('Failed to start tog CLI:', error.message)
  process.exit(1)
})