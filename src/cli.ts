/**
 * Main CLI Entry Point
 *
 * Sets up Commander.js and registers all available commands.
 * This is the new simplified entry point replacing oclif's complex setup.
 */

import { Command } from 'commander'
import { createPingCommand } from './commands/ping.js'

// Create the main program
const program = new Command()

// Configure the main program
program
  .name('tog')
  .description('Toggl CLI - Simple time tracking from the command line')
  .version('0.6.0')

// Register commands
program.addCommand(createPingCommand())

// Parse command line arguments
program.parse()

export default program