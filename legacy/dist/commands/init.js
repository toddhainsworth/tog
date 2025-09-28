import { Flags } from '@oclif/core';
import * as readline from 'node:readline/promises';
import { BaseCommand } from '../lib/base-command.js';
import { getConfigFilePath, saveConfig } from '../lib/config.js';
import { promptForWorkspaceSelection, withSpinner } from '../lib/prompts.js';
import { TogglClient } from '../lib/toggl-client.js';
import { ApiTokenSchema } from '../lib/validation.js';
export default class Init extends BaseCommand {
    static description = 'Initialize Toggl CLI with API token';
    static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --validate'];
    static flags = {
        validate: Flags.boolean({ char: 'v', description: 'Validate API token by testing connection to Toggl API' }),
    };
    async run() {
        const { flags } = await this.parse(Init);
        // Set up interactive prompt for user input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        try {
            // Welcome message and instructions
            this.log("Welcome to Toggl CLI! Let's set up your API token.");
            this.log('You can find your API token at: https://track.toggl.com/profile');
            // Prompt user for their API token
            const token = await rl.question('Enter your Toggl API token: ');
            // Validate token format (must be at least 32 characters)
            let validatedToken;
            try {
                validatedToken = ApiTokenSchema.assert(token);
            }
            catch (error) {
                this.error(`Invalid API token: ${error instanceof Error ? error.message : String(error)}`);
                return;
            }
            // Optional API validation - test token against Toggl API
            if (flags.validate) {
                const client = new TogglClient(validatedToken);
                let isValid;
                try {
                    isValid = await withSpinner('Validating API token...', () => client.ping(), {
                        log: this.log.bind(this),
                        warn: this.warn.bind(this)
                    });
                }
                catch (error) {
                    this.handleError(error, 'API validation failed');
                    return;
                }
                if (!isValid) {
                    this.handleError(new Error('API token validation failed. Your API token doesn\'t work with the Toggl API. Please check your token and try again.'), 'Token validation failed');
                }
                this.logSuccess('API token validated successfully!');
            }
            // Fetch available workspaces for selection
            const client = new TogglClient(validatedToken);
            let workspaces;
            try {
                workspaces = await withSpinner('Fetching available workspaces...', () => client.getWorkspaces(), {
                    log: this.log.bind(this),
                    warn: this.warn.bind(this)
                });
            }
            catch (error) {
                this.handleError(error, 'Failed to fetch workspaces');
                return;
            }
            if (workspaces.length === 0) {
                this.handleError(new Error('No workspaces found for your account. Please ensure you have access to at least one workspace.'), 'No workspaces available');
                return;
            }
            // Use enhanced workspace selection
            let selectedWorkspaceId;
            try {
                selectedWorkspaceId = await promptForWorkspaceSelection(workspaces);
                const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
                if (selectedWorkspace) {
                    this.logSuccess(`Selected workspace: "${selectedWorkspace.name}"`);
                }
            }
            catch (error) {
                this.handleError(error, 'Failed to select workspace');
                return;
            }
            // Save the validated token and workspace ID to configuration file
            saveConfig({
                apiToken: validatedToken,
                workspaceId: selectedWorkspaceId
            });
            this.logSuccess(`Configuration saved successfully to ${getConfigFilePath()}`);
            this.log('You can now use other Toggl CLI commands!');
        }
        catch (error) {
            this.handleError(error, 'Failed to save configuration');
        }
        finally {
            rl.close();
        }
    }
}
