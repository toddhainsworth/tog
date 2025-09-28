import { BaseCommand } from '../lib/base-command.js';
export default class Init extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        validate: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
