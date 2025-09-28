/**
 * Main CLI Entry Point
 *
 * Sets up Commander.js and registers all available commands.
 * This is the new simplified entry point replacing oclif's complex setup.
 */

import { Command } from 'commander'
import { createPingCommand } from './commands/ping.js'
import { createCurrentCommand } from './commands/current.js'
import { createStopCommand } from './commands/stop.js'
import { createStartCommand } from './commands/start.js'
import { createInitCommand } from './commands/init.js'
import { createNukeCommand } from './commands/nuke.js'
import { createProjectsCommand } from './commands/projects.js'
import { createTasksCommand } from './commands/tasks.js'
import { createContinueCommand } from './commands/continue.js'
import { createEditCommand } from './commands/edit.js'
import { createClientsCommand } from './commands/clients.js'
import { createWeekCommand } from './commands/week.js'
import { createTodayCommand } from './commands/today.js'
import { createSearchCommand } from './commands/search.js'

// Create the main program
const program = new Command()

// Configure the main program
program
  .name('tog')
  .description('Toggl CLI - Simple time tracking from the command line')
  .version('0.6.0')

// Register commands
program.addCommand(createPingCommand())
program.addCommand(createCurrentCommand())
program.addCommand(createStopCommand())
program.addCommand(createStartCommand())
program.addCommand(createInitCommand())
program.addCommand(createNukeCommand())
program.addCommand(createProjectsCommand())
program.addCommand(createTasksCommand())
program.addCommand(createContinueCommand())
program.addCommand(createEditCommand())
program.addCommand(createClientsCommand())
program.addCommand(createWeekCommand())
program.addCommand(createTodayCommand())
program.addCommand(createSearchCommand())

// Parse command line arguments
program.parse()

export default program
