import { BaseCommand } from '../lib/base-command.js';
export default class Search extends BaseCommand {
    static args: {
        query: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    static description: string;
    static examples: string[];
    static flags: {
        all: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        year: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        debug: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
