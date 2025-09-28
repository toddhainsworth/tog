import { BaseCommand } from '../lib/base-command.js';
export default class Continue extends BaseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
    private createContinuedTimer;
    private selectTimerWithProgressiveDisclosure;
    private showTimerBeingContinued;
}
