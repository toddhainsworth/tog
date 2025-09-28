import { BaseCommand } from '../lib/base-command.js';
export default class Week extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        last: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private fillMissingDays;
}
