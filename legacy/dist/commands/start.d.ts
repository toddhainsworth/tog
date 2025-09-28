import { BaseCommand } from '../lib/base-command.js';
export default class Start extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        description: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        project: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        task: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<void>;
    private getTimerDescription;
    private selectProjectAndTask;
}
