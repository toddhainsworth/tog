import { confirm, input, search } from '@inquirer/prompts';
import ora from 'ora';
import { EMOJIS } from './emojis.js';
export async function promptForDescription(message = 'Enter timer description') {
    const description = await input({
        message: `${EMOJIS.INFO} ${message}:`,
        transformer(input) {
            const trimmed = input.trim();
            const remaining = 200 - trimmed.length;
            return remaining < 20 ? `${trimmed} (${remaining} chars left)` : trimmed;
        },
        validate(input) {
            const trimmed = input.trim();
            if (trimmed.length === 0) {
                return 'Description cannot be empty';
            }
            if (trimmed.length > 200) {
                return 'Description must be 200 characters or less';
            }
            return true;
        }
    });
    return description.trim();
}
export async function promptForOptionalDescription(message = 'Enter new timer description (or press Enter to skip)') {
    const description = await input({
        message: `${EMOJIS.INFO} ${message}:`,
        transformer(input) {
            const trimmed = input.trim();
            if (trimmed.length === 0) {
                return 'Press Enter to skip';
            }
            const remaining = 200 - trimmed.length;
            return remaining < 20 ? `${trimmed} (${remaining} chars left)` : trimmed;
        },
        validate(input) {
            const trimmed = input.trim();
            // Allow empty input (user wants to skip)
            if (trimmed.length === 0) {
                return true;
            }
            if (trimmed.length > 200) {
                return 'Description must be 200 characters or less';
            }
            return true;
        }
    });
    const trimmed = description.trim();
    return trimmed.length === 0 ? null : trimmed;
}
export async function promptForTaskSelection(tasks, projects) {
    const choices = [];
    // Add tasks first (with project context)
    if (tasks.length > 0) {
        for (const task of tasks) {
            const project = projects.find(p => p.id === task.project_id);
            const projectName = project?.name || task.project_name || 'Unknown Project';
            const clientName = project?.client_name || task.client_name || '';
            const clientSuffix = clientName ? ` (${clientName})` : '';
            const displayName = `📋 ${task.name} - ${projectName}${clientSuffix}`;
            choices.push({
                name: displayName,
                short: task.name,
                value: {
                    display: displayName,
                    project_id: task.project_id,
                    task_id: task.id
                }
            });
        }
    }
    // Add projects without tasks
    const projectsWithoutTasks = projects.filter(p => !tasks.some(t => t.project_id === p.id));
    for (const project of projectsWithoutTasks) {
        const clientSuffix = project.client_name ? ` (${project.client_name})` : '';
        const displayName = `📁 ${project.name}${clientSuffix}`;
        choices.push({
            name: displayName,
            short: project.name,
            value: {
                display: displayName,
                project_id: project.id
            }
        });
    }
    if (choices.length === 0) {
        throw new Error('No tasks or projects available for selection');
    }
    // Use search for better UX with filtering capability
    const selection = await search({
        message: `${EMOJIS.LOADING} Select a ${tasks.length > 0 ? 'task or project' : 'project'}:`,
        pageSize: Math.min(15, choices.length),
        async source(input) {
            // If no input, return all choices
            if (!input) {
                return choices.map(choice => ({
                    name: choice.name,
                    value: choice.value,
                }));
            }
            // Filter choices based on input (case-insensitive partial match)
            const searchTerm = input.toLowerCase();
            const filtered = choices.filter(choice => choice.name.toLowerCase().includes(searchTerm));
            // Return filtered choices or show no matches message
            if (filtered.length === 0) {
                return [{
                        name: 'No matches found',
                        value: null,
                    }];
            }
            return filtered.map(choice => ({
                name: choice.name,
                value: choice.value,
            }));
        },
    });
    // Handle case where no match was found
    if (selection === null) {
        throw new Error('No valid selection made');
    }
    return selection;
}
export async function promptForConfirmation(message, defaultValue = false) {
    return confirm({
        default: defaultValue,
        message: `${EMOJIS.WARNING} ${message}`
    });
}
/**
 * Prompts user to select a timer from available options.
 *
 * **Side Effect**: When showRecentOption=true, adds a special navigation option
 * that returns the string 'show-recent' instead of a TimerOption. This enables
 * progressive disclosure UX where favorites are shown first, with an option to
 * switch to recent timers.
 *
 * @param options - Available timer options to choose from
 * @param showRecentOption - If true, adds "Show recent timers instead" option
 * @returns Either a selected TimerOption OR the string 'show-recent' (navigation command)
 */
export async function promptForTimerSelection(options, showRecentOption = false) {
    if (options.length === 0) {
        throw new Error('No timer options available for selection');
    }
    // Add "Show recent timers" option if requested
    const choices = options.map(option => ({
        name: option.display,
        short: option.description || 'Untitled',
        value: option,
    }));
    if (showRecentOption) {
        choices.push({
            name: '🕐 Show recent timers instead',
            short: 'Show recent',
            value: 'show-recent',
        });
    }
    // Use search for better UX with filtering capability
    const selection = await search({
        message: `${EMOJIS.LOADING} Select a timer to continue:`,
        pageSize: Math.min(15, choices.length),
        async source(input) {
            // If no input, return all choices
            if (!input) {
                return choices.map(choice => ({
                    name: choice.name,
                    value: choice.value,
                }));
            }
            // Filter choices based on input (case-insensitive partial match)
            const searchTerm = input.toLowerCase();
            const filtered = choices.filter(choice => choice.name.toLowerCase().includes(searchTerm));
            // Return filtered choices or show no matches message
            if (filtered.length === 0) {
                return [{
                        name: 'No matches found',
                        value: null,
                    }];
            }
            return filtered.map(choice => ({
                name: choice.name,
                value: choice.value,
            }));
        },
    });
    // Handle case where no match was found
    if (selection === null) {
        throw new Error('No valid selection made');
    }
    return selection;
}
export async function promptForWorkspaceSelection(workspaces) {
    if (workspaces.length === 0) {
        throw new Error('No workspaces available for selection');
    }
    if (workspaces.length === 1) {
        const workspace = workspaces[0];
        if (!workspace) {
            throw new Error('Workspace data is unexpectedly missing');
        }
        return workspace.id;
    }
    const choices = workspaces.map(workspace => ({
        name: workspace.name,
        short: workspace.name,
        value: workspace.id
    }));
    // Use search for better UX with filtering capability
    const selection = await search({
        message: `${EMOJIS.LOADING} Select default workspace:`,
        pageSize: Math.min(10, choices.length),
        async source(input) {
            // If no input, return all choices
            if (!input) {
                return choices.map(choice => ({
                    name: choice.name,
                    value: choice.value,
                }));
            }
            // Filter choices based on input (case-insensitive partial match)
            const searchTerm = input.toLowerCase();
            const filtered = choices.filter(choice => choice.name.toLowerCase().includes(searchTerm));
            // Return filtered choices or show no matches message
            if (filtered.length === 0) {
                return [{
                        name: 'No matches found',
                        value: null,
                    }];
            }
            return filtered.map(choice => ({
                name: choice.name,
                value: choice.value,
            }));
        },
    });
    // Handle case where no match was found
    if (selection === null) {
        throw new Error('No valid workspace selected');
    }
    return selection;
}
// Loading utilities for better UX during async operations with oclif integration
export async function withSpinner(text, operation, context) {
    // If JSON output is enabled, don't show spinner
    if (context.jsonEnabled?.()) {
        return operation();
    }
    const spinner = ora({
        spinner: 'dots',
        text
    }).start();
    try {
        const result = await operation();
        spinner.succeed(`${text.replace(/\.\.\.$/, '')} completed`);
        return result;
    }
    catch (error) {
        spinner.fail(`${text.replace(/\.\.\.$/, '')} failed`);
        // Use oclif's logging for errors
        if (error instanceof Error && context.warn) {
            context.warn(`Operation failed: ${error.message}`);
        }
        throw error;
    }
}
