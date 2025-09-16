import {Command} from '@oclif/core'
import * as readline from 'readline/promises'
import * as fs from 'fs'
import * as path from 'path'

// @ts-ignore - home-config doesn't have types
import homeConfig from 'home-config'

export default class Nuke extends Command {
  static override description = 'Delete Toggl CLI configuration'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    try {
      // Check if config file exists
      const configPath = path.resolve((homeConfig as any).homeDir, '.togrc')
      const configExists = fs.existsSync(configPath)

      if (!configExists) {
        this.log('ℹ️  No Toggl CLI configuration found. Nothing to delete.')
        return
      }

      this.log('⚠️  This will permanently delete your Toggl CLI configuration (~/.togrc)')
      this.log('You will need to run `tog init` again to set up your API token.')

      const confirmation = await rl.question('Are you sure you want to continue? (y/N): ')

      if (confirmation.toLowerCase() !== 'y' && confirmation.toLowerCase() !== 'yes') {
        this.log('❌ Operation cancelled.')
        return
      }

      fs.unlinkSync(configPath)
      this.log('✓ Toggl CLI configuration deleted successfully')
      this.log('Run `tog init` to set up your API token again.')

    } catch (error) {
      this.error(`Failed to delete configuration: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      rl.close()
    }
  }
}
