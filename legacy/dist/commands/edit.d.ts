import { BaseCommand } from '../lib/base-command.js';
export default class Edit extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        clear: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        description: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        project: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        task: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<void>;
    private showCurrentTimer;
    private showUpdateSummary;
}
