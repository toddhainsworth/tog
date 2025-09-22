# PRD: Workspace Listing Commands

## Overview

Add three new commands to the Toggl CLI that allow users to view and explore their workspace structure: `tog projects`, `tog clients`, and `tog tasks`. These commands provide essential visibility into workspace entities and their relationships.

## Objectives

### Primary Goals
- **Workspace Visibility**: Enable users to quickly view all projects, clients, and tasks in their workspace
- **Structure Understanding**: Help users understand the relationships between clients, projects, and tasks
- **Consistent UX**: Provide uniform command patterns and output formatting across all listing commands

### Success Metrics
- Users can efficiently discover available projects, clients, and tasks
- Commands follow established CLI patterns and error handling
- Tree view provides clear hierarchical understanding of workspace structure

## User Stories

### As a user, I want to:
1. **View all projects** so I can see what's available for time tracking
2. **View all clients** so I can understand my workspace organization
3. **View all tasks** so I can see specific work items available
4. **See client hierarchy** so I can understand how projects and tasks are organized under clients
5. **Handle empty results gracefully** so I understand when no data is available

## Technical Requirements

### Command Specifications

#### `tog projects`
**Purpose**: List all projects in the workspace
**Output**: Table format showing project information
**Fields**: Name, Client, Active Status, ID

#### `tog clients`
**Purpose**: List all clients in the workspace
**Output**: Table format showing client information
**Fields**: Name, Project Count, ID
**Special Flag**: `--tree` for hierarchical view

#### `tog tasks`
**Purpose**: List all tasks in the workspace
**Output**: Table format showing task information
**Fields**: Name, Project, Active Status, ID

### API Integration
- Leverage existing `TogglClient` methods: `getProjects()`, `getTasks()`
- Add new `getClients()` method to `TogglClient`
- Handle API pagination internally (no UI pagination)
- Use existing error handling patterns from `BaseCommand`

### Output Formatting

#### Table Format (Default)
```
┌──────────────────┬─────────────┬────────┬──────┐
│ Name             │ Client      │ Active │ ID   │
├──────────────────┼─────────────┼────────┼──────┤
│ Website Redesign │ ACME Corp   │ ✓      │ 1234 │
│ Mobile App       │ ACME Corp   │ ✓      │ 1235 │
│ Internal Tools   │ No Client   │ ✓      │ 1236 │
└──────────────────┴─────────────┴────────┴──────┘
```

#### Tree Format (`tog clients --tree`)
```
📁 ACME Corp
├── 📋 Website Redesign
│   ├── 📝 Frontend Development
│   └── 📝 Backend API
└── 📋 Mobile App
    ├── 📝 iOS Development
    └── 📝 Android Development

📁 Beta Company
└── 📋 Marketing Campaign
    └── 📝 Content Creation

📁 No Client
├── 📋 Internal Tools
│   └── 📝 Code Review
└── 📋 Personal Project
```

### Data Handling

#### Entity Relationships
- **Orphaned Projects**: Group under "No Client" section
- **Orphaned Tasks**: Group under "No Project" section
- **Empty Clients**: Show clients even if they have no projects

#### Sorting
- All entities sorted alphabetically by name
- Consistent sorting across all commands and views

#### Empty States
- **No data available**: Display clear "No [entity type] found" message
- **Example**: "No projects found in this workspace"

## Implementation Details

### Command Structure
```typescript
// src/commands/projects.ts
export default class Projects extends BaseCommand {
  static override description = 'List all projects in the workspace'
  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    // Implementation follows existing patterns
  }
}
```

### New API Method
```typescript
// Add to src/lib/toggl-client.ts
async getClients(): Promise<Client[]> {
  // Fetch and validate client data
}
```

### Validation Schema
```typescript
// Add to src/lib/validation.ts
export const ClientSchema = type({
  id: 'number',
  name: 'string',
  // Additional client fields
})
```

## Edge Cases & Error Handling

### API Failures
- **Network errors**: Use existing `handleError()` pattern from `BaseCommand`
- **Authentication failures**: Leverage existing error handling infrastructure
- **Timeout/Rate limits**: Follow established retry/failure patterns

### Data Issues
- **Large datasets**: Handle via internal API pagination (transparent to user)
- **Missing relationships**: Display entities in "No [Parent]" sections
- **Duplicate names**: Show with IDs for disambiguation

### User Experience
- **Loading states**: Use existing spinner patterns from `withSpinner()`
- **Error messages**: Follow established emoji and formatting patterns
- **Consistent behavior**: Match existing command response patterns

## Acceptance Criteria

### Core Functionality
- [ ] `tog projects` displays all projects in table format
- [ ] `tog clients` displays all clients in table format
- [ ] `tog tasks` displays all tasks in table format
- [ ] `tog clients --tree` displays hierarchical client/project/task view
- [ ] All commands sort results alphabetically
- [ ] All commands handle empty datasets gracefully

### Data Accuracy
- [ ] Projects show correct client associations
- [ ] Tasks show correct project associations
- [ ] Orphaned entities appear in "No [Parent]" sections
- [ ] Active/inactive status displayed correctly
- [ ] All entity IDs displayed correctly

### Error Handling
- [ ] API failures show user-friendly error messages
- [ ] Network issues handled gracefully
- [ ] Authentication errors directed to appropriate resolution
- [ ] Commands exit with appropriate error codes

### User Experience
- [ ] Loading spinners shown during API calls
- [ ] Output formatting is clean and readable
- [ ] Tree view uses consistent indentation and symbols
- [ ] Commands follow established help and example patterns

### Technical Requirements
- [ ] Commands extend `BaseCommand` class
- [ ] Use existing `TogglClient` for API calls
- [ ] Follow established validation patterns
- [ ] Maintain existing code style and conventions
- [ ] Include comprehensive test coverage

## Testing Strategy

### Unit Tests
- Command parsing and flag handling
- Data formatting and display logic
- Tree structure generation
- Error handling scenarios

### Integration Tests
- API client method functionality
- End-to-end command execution
- Error scenarios with mocked API failures

### Manual Testing
- Large datasets (100+ entities)
- Empty workspace scenarios
- Mixed active/inactive entities
- Network failure scenarios

## Future Considerations

### Potential Enhancements
- Filtering capabilities (active/inactive, by client, etc.)
- Search functionality within listings
- Export capabilities (CSV, JSON)
- Interactive selection for starting timers

### Maintenance
- Monitor API response times with large datasets
- Consider caching strategies if performance becomes an issue
- Review output formatting based on user feedback

---

**Dependencies**: None - builds on existing infrastructure
**Timeline**: Can be implemented incrementally (one command at a time)
**Risk Level**: Low - leverages established patterns and infrastructure