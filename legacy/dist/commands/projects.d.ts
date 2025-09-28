import { BaseCommand } from '../lib/base-command.js';
export default class Projects extends BaseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
}
