import { BaseCommand } from '../lib/base-command.js';
export default class Stop extends BaseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
}
