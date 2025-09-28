import Table from 'cli-table3';
import ora from 'ora';
import { BaseCommand } from '../lib/base-command.js';
import { ProjectService } from '../lib/project-service.js';
export default class Projects extends BaseCommand {
    static description = 'List all projects in the workspace';
    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];
    async run() {
        this.loadConfigOrExit();
        const client = this.getClient();
        const spinner = ora('Fetching projects...').start();
        try {
            const projects = await ProjectService.getProjects(client, this.getLoggingContext());
            spinner.succeed();
            if (projects.length === 0) {
                this.logInfo('No projects found in this workspace');
                return;
            }
            // Sort projects using ProjectService
            const sortedProjects = ProjectService.sortProjectsByName(projects);
            // Create and display table
            const table = new Table({
                colWidths: [8, 40, 25, 8],
                head: ['ID', 'Name', 'Client', 'Active'],
                style: { head: ['cyan'] },
                wordWrap: true,
            });
            for (const project of sortedProjects) {
                const clientName = project.client_name || 'No Client';
                const activeStatus = project.active ? '✓' : '✗';
                table.push([project.id, project.name, clientName, activeStatus]);
            }
            this.log('');
            this.log(table.toString());
            this.log('');
        }
        catch (error) {
            spinner.fail('Failed to fetch projects');
            this.handleError(error, 'Error fetching projects');
        }
    }
}
