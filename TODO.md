# TODO

## Testing Improvements

### Dependency Injection for Better Testability
- [ ] Refactor commands to use dependency injection pattern
- [ ] Create interfaces for external dependencies:
  - [ ] Logger interface (for replacing console.log/this.log)
  - [ ] Prompter interface (for replacing inquirer/readline)
  - [ ] Spinner interface (for replacing ora)
  - [ ] FileSystem interface (for config read/write)
- [ ] Allow injection of mock implementations during testing
- [ ] This would enable full command testing without side effects

### Benefits of Dependency Injection
- Commands become fully testable without complex mocking
- Spinners and prompts can be easily replaced with test doubles
- No more issues with stdout capture in tests
- Better separation of concerns

### Implementation Ideas
```typescript
// Example interface
interface Logger {
  log(message: string): void
  error(message: string): void
  warn(message: string): void
}

// Command could accept dependencies
class MyCommand extends Command {
  constructor(private deps: {logger?: Logger} = {}) {
    this.logger = deps.logger || defaultLogger
  }
}
```