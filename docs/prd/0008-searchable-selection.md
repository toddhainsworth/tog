# PRD 0008: Searchable Selection in Prompts

## Overview
Enhance the existing project, client, and task selection prompts with type-to-search functionality, allowing users to quickly filter options by typing part of the name rather than only using arrow keys to navigate.

## Objectives
- Reduce time spent navigating long lists of projects/tasks/clients
- Improve user experience for users with many workspace items
- Maintain backward compatibility with arrow key navigation
- Provide immediate visual feedback during search
- Keep implementation simple with basic wildcard matching

## Requirements

### Technical Requirements
- Enhance existing select prompts in `src/lib/prompts.ts`
- Implement real-time filtering as user types
- Support case-insensitive partial matching
- Maintain arrow key navigation alongside search
- Use existing `@inquirer/prompts` capabilities or extend if needed
- Ensure search works in `start` command and any future commands using selection

### Functional Requirements
- User can type to filter project/client/task lists
- Search matches any part of the name (wildcard/contains match)
- Case-insensitive matching for better usability
- Visual indicator showing search is active
- Clear search with ESC or backspace when empty
- Arrow keys still work for navigation within filtered results
- Enter selects highlighted option
- Show "No matches found" when search yields no results

### Code Structure
- `src/lib/prompts.ts` - Enhance `promptForTaskSelection` and related functions
- `src/commands/start.ts` - No changes needed, benefits automatically
- Future commands will inherit searchable behavior
- Add tests for search functionality

### Data Models
```typescript
// No new models needed - enhance existing selection prompts
// May need to customize inquirer select options:
interface SearchableSelectOptions {
  message: string;
  choices: Choice[];
  searchable?: boolean;  // Enable search (default: true)
  searchPlaceholder?: string;  // "Type to search..."
  noMatchesMessage?: string;  // "No matches found"
}
```

## Acceptance Criteria
- [ ] Typing filters the list in real-time
- [ ] Search is case-insensitive
- [ ] Partial matches work (e.g., "api" matches "API Integration")
- [ ] ESC key clears search filter
- [ ] Arrow keys navigate filtered results
- [ ] Visual feedback shows when search is active
- [ ] "No matches found" message when filter yields empty results
- [ ] Works for project selection in start command
- [ ] Works for task selection in start command
- [ ] Works for client selection if implemented

## Dependencies
- None - enhances existing prompt functionality

## Notes
- Prefer using inquirer's built-in search if available, or implement custom
- Future enhancement: fuzzy matching instead of simple contains
- Future enhancement: could add regex support for power users in future
- Search should be intuitive without requiring documentation
- Consider highlighting matched portion of text in results, low priority

---

**Status:** Draft - Awaiting approval
