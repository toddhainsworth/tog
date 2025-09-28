import { BaseCommand } from '../lib/base-command.js';
export default class Today extends BaseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
}
