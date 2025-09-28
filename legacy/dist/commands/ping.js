import { Flags } from '@oclif/core';
import { BaseCommand } from '../lib/base-command.js';
import { withSpinner } from '../lib/prompts.js';
import { UserService } from '../lib/user-service.js';
export default class Ping extends BaseCommand {
    static description = 'Test connection to Toggl API using stored token';
    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];
    static flags = {
        json: Flags.boolean({ description: 'Format output as json' }),
    };
    async run() {
        try {
            const { flags } = await this.parse(Ping);
            // Load config and create client using base class methods
            this.loadConfigOrExit();
            const client = this.getClient();
            const result = await withSpinner('Testing connection to Toggl API...', () => UserService.validateToken(client, this.getLoggingContext()), {
                jsonEnabled: () => flags.json,
                log: this.log.bind(this),
                warn: this.warn.bind(this)
            });
            const isConnected = result.isValid;
            if (flags.json) {
                return { connected: isConnected, message: isConnected ? 'API connection successful' : 'API connection failed' };
            }
            if (isConnected) {
                this.logSuccess('Successfully connected to Toggl API!');
                this.log('Your API token is working correctly.');
            }
            else {
                const errorMessage = result.error || 'Failed to connect to Toggl API. Your API token may be invalid.';
                this.handleError(new Error(errorMessage), 'Connection test failed');
            }
        }
        catch (error) {
            this.handleError(error, 'Failed to test connection');
        }
    }
}
