# PRD 0005: Enhanced CLI User Experience

## Overview
Improve the CLI user experience by replacing basic readline prompts with rich interactive interfaces that support arrow key navigation, visual selection indicators, and better input handling for a more modern CLI feel.

## Objectives
- Enhance user experience with modern CLI interaction patterns
- Replace basic text prompts with arrow-key navigable menus
- Improve visual feedback and selection indicators
- Make the CLI feel more professional and user-friendly
- Support common CLI UX patterns (search, filtering, multi-select where appropriate)

## Requirements

### Technical Requirements
- Replace readline with `inquirer.js` for rich CLI interactions
- Use inquirer's TypeScript definitions and ES modules support
- Maintain TypeScript compatibility and ES modules support
- Keep consistent with existing emoji constants and styling
- Ensure cross-platform compatibility (Windows, macOS, Linux)

### Functional Requirements

#### Enhanced Task/Project Selection
- Arrow key navigation through task/project lists
- Visual highlight of current selection
- Search/filter functionality for large lists
- Clear visual separators between tasks and projects
- Keyboard shortcuts for common actions (Enter to select, Esc to cancel)

#### Improved Timer Description Input
- Better input prompt with validation feedback
- Support for input history/suggestions
- Clear visual indication of required vs optional fields
- Character count or input guidelines where helpful

#### Enhanced Confirmation Prompts
- Replace y/N prompts with proper confirmation dialogs
- Visual indicators for destructive actions (nuke command)
- Clear action buttons/options with keyboard navigation

#### Better Error and Success Feedback
- Consistent visual styling for all message types
- Progress indicators for API operations
- Loading spinners with descriptive text
- Success animations or visual confirmation

### Code Structure
- `src/lib/prompts.ts` - Shared prompt utilities and wrappers
- Update all commands to use enhanced prompts instead of readline
- Maintain backward compatibility during transition
- Consider prompt themes/styling consistency

### Data Models
```typescript
// Enhanced prompt utilities
interface TaskChoice {
  value: {task_id?: number, project_id?: number}
  name: string
  description?: string
  disabled?: boolean
}

interface PromptConfig {
  message: string
  choices?: TaskChoice[]
  validate?: (input: string) => boolean | string
  default?: string
}
```

## Acceptance Criteria
- [x] Research and select appropriate CLI interaction library
- [x] Create shared prompt utilities with consistent styling
- [x] Replace task/project selection with arrow-key navigation
- [x] Replace timer description input with enhanced text prompt
- [x] Replace confirmation prompts in nuke command
- [x] Update init command with enhanced workspace selection
- [x] Maintain all existing functionality while improving UX
- [x] Test enhanced UX implementation
- [ ] Update all loading states with progress indicators (future enhancement)
- [ ] Test across different terminal environments (manual testing required)
- [ ] Ensure accessibility considerations are met (ongoing)

## Dependencies
- PRD 0004: Start and Stop Timer Commands (enhances existing interactive functionality)

## Notes
- Focus on improving existing interactions rather than adding new functionality
- Consider popular CLI tools (npm CLI, git CLI, etc.) for UX inspiration
- Selected library: `inquirer.js` for its maturity, TypeScript support, and rich feature set
- Maintain consistent branding with existing emoji constants
- Consider terminal size and responsive design for different screen sizes
- Future consideration: Command palette or fuzzy search for commands

---

**Status:** Implementation Complete - Enhanced CLI UX with inquirer.js successfully implemented