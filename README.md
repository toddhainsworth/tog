tog
=================

A modern CLI for Toggl time tracking with enhanced user experience


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

## Features

- 🚀 **Modern CLI UX** - Enhanced prompts with arrow-key navigation and spinners
- ⏱️ **Timer Management** - Start, stop, edit, continue, and check status of Toggl timers
- 📊 **Project Integration** - Select from your Toggl projects and tasks with searchable selection
- 📋 **Workspace Visibility** - List all projects, clients, and tasks with hierarchical views
- 📈 **Time Reporting** - Daily and weekly summaries with project breakdowns
- 🔧 **Easy Setup** - Simple configuration with API token validation
- 💫 **Loading Indicators** - Visual feedback for all API operations
- 🔄 **Quick Actions** - Continue last timer, quick start with flags

## Quick Start

1. **Install** (when published to npm):
   ```bash
   npm install -g tog
   ```

2. **Configure** with your Toggl API token:
   ```bash
   tog init
   ```

3. **Explore your workspace**:
   ```bash
   tog projects     # List all projects
   tog clients      # List all clients
   tog tasks        # List all tasks
   tog clients --tree  # Hierarchical view
   ```

4. **Start tracking time**:
   ```bash
   tog start               # Interactive selection
   tog start -d "Fix bug"  # Quick start with description
   ```

5. **Manage timers**:
   ```bash
   tog current    # Check current timer
   tog stop       # Stop timer
   tog continue   # Continue last timer
   tog edit       # Edit current timer
   ```

6. **View time summaries**:
   ```bash
   tog today      # Today's time summary
   tog week       # Current week summary
   tog week --last # Previous week summary
   ```

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g tog
$ tog COMMAND
running command...
$ tog (--version)
tog/0.2.2 darwin-arm64 node-v22.17.0
$ tog --help [COMMAND]
USAGE
  $ tog COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tog clients`](#tog-clients)
* [`tog continue`](#tog-continue)
* [`tog current`](#tog-current)
* [`tog edit`](#tog-edit)
* [`tog help [COMMAND]`](#tog-help-command)
* [`tog init`](#tog-init)
* [`tog nuke`](#tog-nuke)
* [`tog ping`](#tog-ping)
* [`tog plugins`](#tog-plugins)
* [`tog plugins add PLUGIN`](#tog-plugins-add-plugin)
* [`tog plugins:inspect PLUGIN...`](#tog-pluginsinspect-plugin)
* [`tog plugins install PLUGIN`](#tog-plugins-install-plugin)
* [`tog plugins link PATH`](#tog-plugins-link-path)
* [`tog plugins remove [PLUGIN]`](#tog-plugins-remove-plugin)
* [`tog plugins reset`](#tog-plugins-reset)
* [`tog plugins uninstall [PLUGIN]`](#tog-plugins-uninstall-plugin)
* [`tog plugins unlink [PLUGIN]`](#tog-plugins-unlink-plugin)
* [`tog plugins update`](#tog-plugins-update)
* [`tog projects`](#tog-projects)
* [`tog start`](#tog-start)
* [`tog stop`](#tog-stop)
* [`tog tasks`](#tog-tasks)
* [`tog today`](#tog-today)
* [`tog week`](#tog-week)

## `tog clients`

List all clients in the workspace

```
USAGE
  $ tog clients [--tree]

FLAGS
  --tree  Display clients in hierarchical tree format with projects and tasks

DESCRIPTION
  List all clients in the workspace

EXAMPLES
  $ tog clients

  $ tog clients --tree
```

_See code: [src/commands/clients.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/clients.ts)_

## `tog continue`

Continue the most recent timer with the same settings

```
USAGE
  $ tog continue

DESCRIPTION
  Continue the most recent timer with the same settings

EXAMPLES
  $ tog continue
```

_See code: [src/commands/continue.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/continue.ts)_

## `tog current`

Show currently running timer

```
USAGE
  $ tog current

DESCRIPTION
  Show currently running timer

EXAMPLES
  $ tog current
```

_See code: [src/commands/current.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/current.ts)_

## `tog edit`

Edit the currently running timer

```
USAGE
  $ tog edit [--clear] [-d <value>] [-p <value>] [-t <value>]

FLAGS
  -d, --description=<value>  New timer description
  -p, --project=<value>      Project name or ID (use "none" to clear)
  -t, --task=<value>         Task name or ID (use "none" to clear)
      --clear                Clear all project and task assignments

DESCRIPTION
  Edit the currently running timer

EXAMPLES
  $ tog edit

  $ tog edit -d "Updated description"

  $ tog edit -p "New Project"

  $ tog edit -p none

  $ tog edit --clear

  $ tog edit -d "New desc" -p "Project" -t "Task"
```

_See code: [src/commands/edit.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/edit.ts)_

## `tog help [COMMAND]`

Display help for tog.

```
USAGE
  $ tog help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for tog.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.33/src/commands/help.ts)_

## `tog init`

Initialize Toggl CLI with API token

```
USAGE
  $ tog init [-v]

FLAGS
  -v, --validate  Validate API token by testing connection to Toggl API

DESCRIPTION
  Initialize Toggl CLI with API token

EXAMPLES
  $ tog init

  $ tog init --validate
```

_See code: [src/commands/init.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/init.ts)_

## `tog nuke`

Delete Toggl CLI configuration

```
USAGE
  $ tog nuke

DESCRIPTION
  Delete Toggl CLI configuration

EXAMPLES
  $ tog nuke
```

_See code: [src/commands/nuke.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/nuke.ts)_

## `tog ping`

Test connection to Toggl API using stored token

```
USAGE
  $ tog ping [--json]

FLAGS
  --json  Format output as json

DESCRIPTION
  Test connection to Toggl API using stored token

EXAMPLES
  $ tog ping
```

_See code: [src/commands/ping.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/ping.ts)_

## `tog plugins`

List installed plugins.

```
USAGE
  $ tog plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ tog plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.47/src/commands/plugins/index.ts)_

## `tog plugins add PLUGIN`

Installs a plugin into tog.

```
USAGE
  $ tog plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into tog.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TOG_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TOG_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ tog plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ tog plugins add myplugin

  Install a plugin from a github url.

    $ tog plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ tog plugins add someuser/someplugin
```

## `tog plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ tog plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ tog plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.47/src/commands/plugins/inspect.ts)_

## `tog plugins install PLUGIN`

Installs a plugin into tog.

```
USAGE
  $ tog plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into tog.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TOG_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TOG_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ tog plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ tog plugins install myplugin

  Install a plugin from a github url.

    $ tog plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ tog plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.47/src/commands/plugins/install.ts)_

## `tog plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ tog plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ tog plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.47/src/commands/plugins/link.ts)_

## `tog plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ tog plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tog plugins unlink
  $ tog plugins remove

EXAMPLES
  $ tog plugins remove myplugin
```

## `tog plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ tog plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.47/src/commands/plugins/reset.ts)_

## `tog plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ tog plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tog plugins unlink
  $ tog plugins remove

EXAMPLES
  $ tog plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.47/src/commands/plugins/uninstall.ts)_

## `tog plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ tog plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tog plugins unlink
  $ tog plugins remove

EXAMPLES
  $ tog plugins unlink myplugin
```

## `tog plugins update`

Update installed plugins.

```
USAGE
  $ tog plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.47/src/commands/plugins/update.ts)_

## `tog projects`

List all projects in the workspace

```
USAGE
  $ tog projects

DESCRIPTION
  List all projects in the workspace

EXAMPLES
  $ tog projects
```

_See code: [src/commands/projects.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/projects.ts)_

## `tog start`

Start a new time tracking timer

```
USAGE
  $ tog start [-d <value>] [-p <value>] [-t <value>]

FLAGS
  -d, --description=<value>  Timer description
  -p, --project=<value>      Project name or ID
  -t, --task=<value>         Task name or ID

DESCRIPTION
  Start a new time tracking timer

EXAMPLES
  $ tog start

  $ tog start -d "Working on API integration"

  $ tog start -d "Bug fix" -p "Backend Project"

  $ tog start -d "Feature work" -p "Frontend" -t "Login system"
```

_See code: [src/commands/start.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/start.ts)_

## `tog stop`

Stop the currently running timer

```
USAGE
  $ tog stop

DESCRIPTION
  Stop the currently running timer

EXAMPLES
  $ tog stop
```

_See code: [src/commands/stop.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/stop.ts)_

## `tog tasks`

List all tasks in the workspace

```
USAGE
  $ tog tasks

DESCRIPTION
  List all tasks in the workspace

EXAMPLES
  $ tog tasks
```

_See code: [src/commands/tasks.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/tasks.ts)_

## `tog today`

Display a comprehensive summary of today's time tracking activities

```
USAGE
  $ tog today

DESCRIPTION
  Display a comprehensive summary of today's time tracking activities

EXAMPLES
  $ tog today
```

_See code: [src/commands/today.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/today.ts)_

## `tog week`

Display comprehensive weekly time tracking summary

```
USAGE
  $ tog week [--last]

FLAGS
  --last  Show previous week instead of current week

DESCRIPTION
  Display comprehensive weekly time tracking summary

EXAMPLES
  $ tog week

  $ tog week --last
```

_See code: [src/commands/week.ts](https://github.com/toddhainsworth/tog/blob/v0.2.2/src/commands/week.ts)_
<!-- commandsstop -->

## 🤖 AI-Powered Development Experiment

This project serves as a comprehensive case study in AI-assisted software development, exploring how far we could push modern AI capabilities using [Claude Code](https://claude.ai/code). The entire codebase was created through a structured collaboration between human strategic guidance and AI implementation.

### Development Workflow

Our AI-assisted development process followed a structured, professional approach:

1. **PRD-Driven Development**: Each feature began with a Product Requirements Document (PRD) that outlined objectives, technical requirements, and acceptance criteria
2. **Collaborative Refinement**: Human and AI worked together to refine requirements, discuss implementation approaches, and clarify technical details
3. **AI Implementation**: Claude Code handled all coding tasks including implementation, testing, and tooling configuration
4. **Human Code Review**: The human developer provided feedback, caught issues, and guided architectural decisions
5. **Iterative Improvement**: Based on feedback, Claude Code refined the implementation until acceptance criteria were met

### What This Demonstrates

Claude Code successfully handled complex software development tasks including:

- **Architecture from scratch** - Complete CLI application structure following industry best practices
- **Full-stack implementation** - TypeScript code, comprehensive tests, build configurations, and dependency management
- **Production-ready patterns** - Error handling, interactive UX, API integration, and user feedback systems
- **Code quality maintenance** - Zero linting errors, strong TypeScript typing, and clean codebase organization
- **Development lifecycle** - Git history, semantic versioning, release management, and documentation

### Human vs AI Contributions

**Human contributions:**
- Initial project requirements and vision
- PRD creation and requirements refinement
- Code review and quality feedback
- Strategic architectural guidance
- Release management oversight

**Claude contributions:**
- All code implementation (100% of TypeScript, tests, configs)
- PRD technical details and acceptance criteria
- Package selection and dependency management
- Error handling patterns and user experience design
- Git commit history and documentation
- Problem-solving and debugging implementation issues

### Challenges and Limitations

While Claude Code handled most development tasks effectively, several challenges emerged throughout development:

**Context Retention:**
- Occasionally overlooked established project conventions documented in CLAUDE.md
- Required reminders about coding standards (e.g., avoiding `any` types, commit message formats)
- Sometimes needed re-direction when deviating from agreed architectural patterns
- Initially implemented unsafe non-null assertions (`!`) requiring guidance toward type-safe Map-based lookups

**Long-term Memory:**
- In longer development sessions, earlier decisions or constraints could be forgotten
- Required periodic reinforcement of project-specific rules and preferences
- Benefited from clear, immediate feedback when straying from established patterns

**Complex Decision Making:**
- Needed human guidance for strategic architectural decisions
- Required clarification when multiple valid implementation approaches existed
- Best performance came with clear, specific requirements rather than open-ended tasks

**Test Environment Considerations:**
- Created tests that inadvertently affected production data (deleting user's `.togrc` file)
- Required implementing configurable file paths and isolated temporary test environments
- Shows importance of considering production environment impact during test design

**Technical Complexity Handling:**
- UTC date handling for week boundaries required multiple iterations to get timezone-consistent behavior
- Table design needed simplification from 6 columns to 2 based on user feedback about visual noise
- Build verification caught TypeScript compilation issues that passing tests missed

**Mitigation Strategies:**
- **CLAUDE.md documentation** provided persistent project context and standards
- **PRD-driven approach** broke complex features into manageable, well-defined tasks
- **Regular human code review** caught deviations and maintained quality standards
- **Iterative feedback loops** allowed for quick course corrections
- **Continuous testing** during development caught edge cases and timezone issues
- **Build verification** ensured TypeScript compilation remained clean

This experiment demonstrates that AI can now handle the full software development lifecycle for real-world applications while maintaining high code quality through structured human oversight, continuous testing, and immediate feedback on problematic patterns.
