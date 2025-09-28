import { BaseCommand } from '../lib/base-command.js';
export default class Ping extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        json: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void | {
        connected: boolean;
        message: string;
    }>;
}
