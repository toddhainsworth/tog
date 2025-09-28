import { BaseCommand } from '../lib/base-command.js';
export default class Current extends BaseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
}
