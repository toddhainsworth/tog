# Development Workflow

This document outlines the AI-assisted development workflow for the Toggl CLI project, building on the successful collaboration patterns established between human strategic guidance and Claude Code implementation.

## Overview

Our development process follows a structured approach that combines Product Requirements Documents (PRDs), GitHub issue tracking, feature branching, and comprehensive code review to ensure high-quality deliverables.

## Workflow Steps

### 1. Feature Planning & PRD Creation

**Local PRD Development:**
- Create new features using the PRD template from `CLAUDE.md`
- Develop PRD locally in `docs/prd/GH-XXX-feature-name.md` (not committed to repo)
- Collaborate between human and Claude to refine requirements
- Fill out all PRD sections thoroughly, asking for clarification on under-developed areas
- **Critical:** Never start implementation until PRD is signed off by the user

**PRD Approval Process:**
- Human reviews and provides feedback on draft PRD
- Claude refines PRD based on feedback
- Process continues until human approves PRD for implementation

### 2. GitHub Issue Creation

**Automated Issue Creation:**
- Once PRD is approved, use GitHub CLI to create issue from PRD content
- Issue title should match PRD title
- Issue description should contain full PRD content
- Apply standardized labels: `prd`, `feature`, `in-progress` (as appropriate)
- Link local PRD to GitHub issue number for tracking

**Issue Management:**
- GitHub issues serve as the single source of truth for approved features
- Local PRDs are kept for development reference but not committed
- Significant updates (implementation ready, completion) posted as issue comments
- PRD revisions update the GitHub issue description

### 3. Feature Branch Development

**Branch Creation:**
- Use naming convention: `feature/GH-XXX_feature_description`
- Branch from `main` (never commit directly to `main`)
- Link branch name to GitHub issue number for automatic tracking

**Development Process:**
- Claude Code implements feature following established patterns in `CLAUDE.md`
- Use TodoWrite tool extensively for task planning and progress tracking
- Follow TypeScript safety guidelines and testing best practices
- Run full test suite, linting, and build verification before completion

### 4. User Testing & Validation

**Implementation Testing:**
- Claude Code completes implementation and quality checks
- **IMPORTANT: Wait for user to test the implementation before committing**
- User tests functionality to verify it works as expected
- User provides feedback on any issues or adjustments needed
- Only proceed to commit after user confirms implementation is working

### 5. Code Review Process

**Claude Code Self-Review:**
- Perform comprehensive self-review focusing on:
  1. **Security** - No exposed secrets, secure API usage, input validation
  2. **Performance** - Efficient algorithms, proper resource management
  3. **Code Quality** - TypeScript safety, clean architecture, maintainability
  4. **Testing Coverage** - Comprehensive tests, edge case handling
- Document review findings and any improvements made
- Self-review should be thorough but human has final sign-off authority

**Human Code Review:**
- Human performs final code review in GitHub PR
- Reviews architecture decisions, user experience, and strategic alignment
- Provides feedback on any issues or improvements needed
- Human approval required before merge

### 6. Pull Request & Integration

**PR Creation:**
- Create PR targeting `main` branch
- PR title should be descriptive: `Feature description`
- **PR description must include linking keywords**: Add `Closes #XXX` in the description body
- This ensures automatic issue linking and closure when merged (keywords in title alone don't work)
- PR description should summarize implementation approach and key changes

**PR Merge & Cleanup:**
- Only merge after both Claude self-review and human approval
- Use GitHub's automatic issue closure via PR merge
- Delete feature branch after successful merge
- Update any related documentation if needed

## Quality Gates

### Pre-Implementation
- [ ] PRD approved by human
- [ ] GitHub issue created with full requirements
- [ ] Feature branch created with proper naming

### Pre-Commit
- [ ] All tests passing (`yarn test`)
- [ ] Linting clean (`yarn lint`)
- [ ] Build successful (`yarn build`)
- [ ] Claude Code self-review completed
- [ ] User has tested implementation and confirmed it works

### Pre-Merge
- [ ] Human code review approved
- [ ] All CI checks passing
- [ ] No merge conflicts with `main`

## Branch Protection

- **Main branch protection:** Never commit directly to `main`
- All changes must go through the PR process
- Feature branches should be short-lived and focused

## File Management

**Local PRDs:**
- Stored in `docs/prd/` (excluded from git via `.gitignore`)
- Named using pattern: `GH-XXX-feature-name.md`
- Maintained during development for reference
- Not committed to repository (GitHub issues are source of truth)

**Code Organization:**
- Follow existing architecture patterns in `CLAUDE.md`
- Use established testing and error handling patterns
- Maintain TypeScript safety standards

## Automation & Tools

**GitHub CLI Integration:**
- Use `gh` commands for issue creation and management
- Automate issue creation from approved PRDs
- Link PRs to issues automatically via naming conventions

**Development Commands:**
- Standard commands documented in `CLAUDE.md` remain unchanged
- All quality checks must pass before PR creation

## Migration of Existing PRDs

Existing PRDs in the repository will be migrated to closed GitHub issues to maintain historical context while transitioning to the new workflow.

## API Client Caching Architecture

### Overview

The project implements intelligent API client caching to reduce API calls for reference data that rarely changes. This system balances performance improvements with data freshness through selective caching and appropriate TTL settings.

### Design Decisions

**1. Reference-Only Caching:**
- Cache only stable reference data: projects, clients, tasks, workspaces, favorites
- **Never cache** frequently changing data like current time entries
- This ensures data consistency while maximizing performance benefits

**2. Simplified File-Based Storage:**
- Single `CachedFileStorage` class provides file-based persistence with TTL
- Removed complex file locking mechanisms (single-process assumption)
- Uses request deduplication to prevent concurrent API calls for the same resource

**3. Uniform Client Interface:**
- `ReferenceCachedTogglClient` extends `TogglClient` maintaining full compatibility
- Services accept `TogglClient` interface (no union types)
- Transparent caching - existing code works unchanged

**4. Conservative TTL Strategy:**
- 1 week TTL for all cached reference data
- Balances data freshness with performance gains
- User can clear cache manually via `clearCache()` method

### Implementation

**CachedFileStorage** (`src/lib/cached-file-storage.ts`):
```typescript
export class CachedFileStorage {
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T>
  async clear(): Promise<void>
  // Request deduplication prevents concurrent API calls
}
```

**ReferenceCachedTogglClient** (`src/lib/reference-cached-toggl-client.ts`):
```typescript
export class ReferenceCachedTogglClient extends TogglClient {
  // Overrides only cache-appropriate methods
  override async getProjects(): Promise<Project[]>
  override async getClients(): Promise<Client[]>
  override async getTasks(): Promise<Task[]>
  override async getWorkspaces(): Promise<Workspace[]>
  override async getFavorites(): Promise<Favorite[]>

  // getCurrentTimeEntry() uses parent implementation (no caching)
}
```

**BaseCommand Integration** (`src/lib/base-command.ts`):
```typescript
protected getClient(): ReferenceCachedTogglClient {
  return new ReferenceCachedTogglClient(config.apiToken, debugLogger)
}
```

### Usage Patterns

**Service Layer:**
- All services continue using `TogglClient` interface
- No changes required to existing service implementations
- Caching is transparent to business logic

**Cache Management:**
- Cache automatically expires after 1 week
- Manual cache clearing available via `client.clearCache()`
- Cache persistence survives command restarts

### Extending the System

**Adding New Cached Methods:**
1. Override method in `ReferenceCachedTogglClient`
2. Use `this.cache.getOrFetch()` with appropriate TTL
3. Ensure method caches stable reference data only

**Custom Cache Storage:**
- Implement interface compatible with `CachedFileStorage`
- Replace storage backend while maintaining API contract
- Consider request deduplication for performance

**Testing Strategy:**
- Comprehensive test coverage for cache logic
- Mock external dependencies to avoid API calls
- Test TTL expiration and cache clearing functionality

### Performance Impact

**Expected Benefits:**
- Reduced API calls for frequently accessed reference data
- Faster command execution after initial cache population
- Improved user experience during interactive workflows

**Monitoring:**
- Debug logging provides cache hit/miss information
- File-based storage enables cache inspection
- Request deduplication prevents API rate limiting

---

This workflow builds on the proven success of our AI-assisted development approach while adding structure for larger feature development and team collaboration.