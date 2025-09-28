import { Flags } from '@oclif/core';
import { BaseCommand } from '../lib/base-command.js';
import { ProjectTaskSelector } from '../lib/project-task-selector.js';
import { promptForDescription } from '../lib/prompts.js';
import { TimerService } from '../lib/timer-service.js';
export default class Start extends BaseCommand {
    static description = 'Start a new time tracking timer';
    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> -d "Working on API integration"',
        '<%= config.bin %> <%= command.id %> -d "Bug fix" -p "Backend Project"',
        '<%= config.bin %> <%= command.id %> -d "Feature work" -p "Frontend" -t "Login system"',
    ];
    static flags = {
        description: Flags.string({ char: 'd', description: 'Timer description' }),
        project: Flags.string({ char: 'p', description: 'Project name or ID' }),
        task: Flags.string({ char: 't', description: 'Task name or ID' }),
    };
    async run() {
        try {
            const { flags } = await this.parse(Start);
            const config = this.loadConfigOrExit();
            const client = this.getClient();
            // Check for running timer
            const runningTimerCheck = await TimerService.checkForRunningTimer(client);
            if (runningTimerCheck.hasRunningTimer) {
                this.logWarning(`Timer is already running: "${runningTimerCheck.currentEntry?.description || 'Untitled'}"`);
                this.log('Use `tog stop` to stop the current timer before starting a new one.');
                return;
            }
            // Get timer description
            const description = await this.getTimerDescription(flags);
            if (!description)
                return;
            // Get available data
            const result = await TimerService.fetchTasksAndProjects(client, {
                log: this.log.bind(this),
                warn: this.warn.bind(this)
            });
            if (!result.tasks || !result.projects)
                return;
            const { projects, tasks } = result;
            // Handle project/task selection
            const selector = new ProjectTaskSelector(projects, tasks);
            const { selectedProject, selectedTask } = await this.selectProjectAndTask(selector, flags);
            // Validate timer creation parameters
            const validationResult = TimerService.validateTimerCreation({
                client,
                config,
                description,
                selectedProject,
                selectedTask
            });
            if (!validationResult.isValid) {
                this.handleError(new Error(validationResult.error ?? 'Timer validation failed'), 'Timer validation failed');
                return;
            }
            // Create and start timer
            const timerResult = await TimerService.createTimer({
                client,
                config,
                description,
                selectedProject,
                selectedTask
            }, {
                log: this.log.bind(this),
                warn: this.warn.bind(this)
            });
            if (timerResult.success) {
                this.logSuccess('Timer started successfully!');
                this.log(`Description: "${description}"`);
                if (selectedProject) {
                    this.log(`Project: ${selectedProject.name}`);
                }
                if (selectedTask) {
                    this.log(`Task: ${selectedTask.name}`);
                }
            }
            else {
                this.handleError(timerResult.error ?? new Error('Timer creation failed'), 'Timer creation failed');
            }
        }
        catch (error) {
            this.handleError(error, 'Failed to start timer');
        }
    }
    async getTimerDescription(flags) {
        if (flags.description) {
            this.log(`Using description: "${flags.description}"`);
            return flags.description;
        }
        this.log('Let\'s start a new timer!');
        try {
            return await promptForDescription();
        }
        catch (error) {
            this.handleError(error, 'Failed to get timer description');
            return null;
        }
    }
    async selectProjectAndTask(selector, flags) {
        try {
            const result = await selector.selectProjectAndTask(flags);
            // Log selections for user feedback
            if (result.selectedProject) {
                this.log(`Using project: ${result.selectedProject.name}`);
            }
            if (result.selectedTask) {
                this.log(`Using task: ${result.selectedTask.name}`);
            }
            // Log interactive selection result if it came from interactive mode
            if (!flags.project && !flags.task && (result.selectedProject || result.selectedTask)) {
                const parts = [];
                if (result.selectedProject)
                    parts.push(result.selectedProject.name);
                if (result.selectedTask)
                    parts.push(`(${result.selectedTask.name})`);
                if (parts.length > 0) {
                    this.logSuccess(`Selected: ${parts.join(' ')}`);
                }
            }
            return result;
        }
        catch (error) {
            this.handleError(error, 'Failed to select project/task');
            return {};
        }
    }
}
