import { BaseCommand } from '../lib/base-command.js';
import { ProjectService } from '../lib/project-service.js';
import { promptForTimerSelection } from '../lib/prompts.js';
import { TaskService } from '../lib/task-service.js';
import { TimeEntryService } from '../lib/time-entry-service.js';
import { TimerSelectionService } from '../lib/timer-selection-service.js';
export default class Continue extends BaseCommand {
    static description = 'Continue the most recent timer with the same settings';
    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];
    async run() {
        try {
            const config = this.loadConfigOrExit();
            const client = this.getClient();
            const timeEntryService = new TimeEntryService(client, this.getLoggingContext());
            // Check for running timer
            const currentResult = await timeEntryService.getCurrentTimeEntry();
            if (currentResult.error) {
                this.handleError(new Error(currentResult.error), 'Failed to check for running timer');
                return;
            }
            if (currentResult.timeEntry) {
                this.logWarning(`Timer is already running: "${currentResult.timeEntry.description || 'Untitled'}"`);
                this.log('Use `tog stop` to stop the current timer before continuing a previous one.');
                return;
            }
            // Get projects and tasks for context
            const projects = await ProjectService.getProjects(client, this.getLoggingContext());
            const tasks = await TaskService.getTasks(client, this.getLoggingContext());
            // Initialize timer selection service
            const selectionService = new TimerSelectionService(client, projects, tasks);
            // Get timer options with favorites and recent timers
            const timerOptions = await selectionService.getTimerOptions();
            // Handle different scenarios
            if (selectionService.hasNoOptions(timerOptions)) {
                this.logInfo('No previous timers found. Use `tog start` to create your first timer!');
                return;
            }
            let selectedOption;
            if (selectionService.hasSingleOption(timerOptions)) {
                // Auto-continue single option (backward compatibility)
                const [singleOption] = timerOptions;
                if (!singleOption) {
                    throw new Error('Timer option unexpectedly missing');
                }
                selectedOption = singleOption;
            }
            else {
                // Multiple options - let user select using progressive disclosure UX pattern
                const hasFavorites = timerOptions.some(opt => opt.isFavorite);
                const hasRecent = timerOptions.some(opt => !opt.isFavorite);
                /**
                 * Progressive Disclosure UX Pattern:
                 * - Show favorites first (most likely choices)
                 * - Provide option to see recent timers if user wants more options
                 * - This reduces cognitive load while maintaining full functionality
                 */
                selectedOption = await this.selectTimerWithProgressiveDisclosure(timerOptions, hasFavorites, hasRecent);
            }
            // Show details of timer being continued
            await this.showTimerBeingContinued(selectedOption, projects, tasks);
            // Create new timer with selected metadata
            await this.createContinuedTimer(selectedOption, config.workspaceId);
        }
        catch (error) {
            this.handleError(error, 'Failed to continue timer');
        }
    }
    async createContinuedTimer(timerOption, workspaceId) {
        const client = this.getClient();
        const timeEntryService = new TimeEntryService(client, this.getLoggingContext());
        // Get projects and tasks to find the objects for the timer option
        const projects = await ProjectService.getProjects(client, this.getLoggingContext());
        const tasks = await TaskService.getTasks(client, this.getLoggingContext());
        // Find the project and task objects if they exist
        const project = timerOption.project_id ?
            ProjectService.findProjectById(projects, timerOption.project_id) || undefined : undefined;
        const task = timerOption.task_id ?
            TaskService.findTaskById(tasks, timerOption.task_id) || undefined : undefined;
        const createResult = await timeEntryService.createTimeEntry({
            description: timerOption.description || '',
            project,
            task,
            workspaceId
        });
        if (createResult.success && createResult.timeEntry) {
            this.logSuccess('Timer continued successfully!');
        }
        else {
            this.handleError(new Error(createResult.error?.message || 'Failed to continue timer'), 'Timer creation failed');
        }
    }
    async selectTimerWithProgressiveDisclosure(timerOptions, hasFavorites, hasRecent) {
        if (hasFavorites && hasRecent) {
            const favoriteOptions = timerOptions.filter(opt => opt.isFavorite);
            const result = await promptForTimerSelection(favoriteOptions, true);
            if (result === 'show-recent') {
                // User wants to see recent timers instead
                const recentOptions = timerOptions.filter(opt => !opt.isFavorite);
                const recentResult = await promptForTimerSelection(recentOptions, false);
                if (recentResult === 'show-recent') {
                    throw new Error('Unexpected show-recent response from recent timers selection');
                }
                return recentResult;
            }
            return result;
        }
        // Only one type available, show them all
        const result = await promptForTimerSelection(timerOptions, false);
        if (result === 'show-recent') {
            throw new Error('Unexpected show-recent response when no favorites available');
        }
        return result;
    }
    async showTimerBeingContinued(option, projects, tasks) {
        this.log('');
        this.log('📋 Continuing timer:');
        this.log(`Description: "${option.description || 'No description'}"`);
        if (option.project_id) {
            const project = projects.find(p => p.id === option.project_id);
            if (project) {
                this.log(`Project: ${project.name}`);
            }
        }
        if (option.task_id) {
            const task = tasks.find(t => t.id === option.task_id);
            if (task) {
                this.log(`Task: ${task.name}`);
            }
        }
        if (option.isFavorite) {
            this.log('Type: ⭐ Favorite');
        }
        else if (option.lastUsed) {
            this.log(`Last used: ${option.lastUsed}`);
        }
        this.log('');
    }
}
