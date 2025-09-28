import type { TimerOption } from './timer-selection-service.js';
import type { Project, Task, Workspace } from './validation.js';
export interface TaskChoice {
    name: string;
    short?: string;
    value: {
        display: string;
        project_id?: number;
        task_id?: number;
    };
}
export interface PromptConfig {
    choices?: TaskChoice[];
    default?: string;
    message: string;
    validate?: (input: string) => boolean | string;
}
export declare function promptForDescription(message?: string): Promise<string>;
export declare function promptForOptionalDescription(message?: string): Promise<null | string>;
interface TaskWithContext extends Task {
    client_name?: string;
    project_name?: string;
}
interface ProjectWithClient extends Project {
    client_name?: string;
}
export declare function promptForTaskSelection(tasks: TaskWithContext[], projects: ProjectWithClient[]): Promise<{
    display: string;
    project_id?: number;
    task_id?: number;
}>;
export declare function promptForConfirmation(message: string, defaultValue?: boolean): Promise<boolean>;
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
export declare function promptForTimerSelection(options: TimerOption[], showRecentOption?: boolean): Promise<'show-recent' | TimerOption>;
export declare function promptForWorkspaceSelection(workspaces: Workspace[]): Promise<number>;
export declare function withSpinner<T>(text: string, operation: () => Promise<T>, context: {
    jsonEnabled?: () => boolean;
    log: (message: string) => void;
    warn?: (message: string) => void;
}): Promise<T>;
export {};
