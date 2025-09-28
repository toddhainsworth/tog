import { BaseCommand } from '../lib/base-command.js';
export default class Clients extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        tree: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private displayClientsTree;
    private displayOrphanedEntities;
    private displayProjectsWithTasks;
    private displayTableView;
    private displayTreeView;
    private organizeTreeData;
}
