tog
=================

A modern CLI for Toggl time tracking with enhanced user experience


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)


## Features

- 🚀 **Modern CLI UX** - Enhanced prompts with arrow-key navigation and spinners
- ⏱️ **Timer Management** - Start, stop, and check status of Toggl timers
- 📊 **Project Integration** - Select from your Toggl projects and tasks
- 🔧 **Easy Setup** - Simple configuration with API token validation
- 💫 **Loading Indicators** - Visual feedback for all API operations

## Quick Start

1. **Install** (when published to npm):
   ```bash
   npm install -g tog
   ```

2. **Configure** with your Toggl API token:
   ```bash
   tog init
   ```

3. **Start tracking time**:
   ```bash
   tog start
   ```

4. **Check current timer**:
   ```bash
   tog current
   ```

5. **Stop timer**:
   ```bash
   tog stop
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
tog/0.0.0 darwin-arm64 node-v22.14.0
$ tog --help [COMMAND]
USAGE
  $ tog COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tog current`](#tog-current)
* [`tog help [COMMAND]`](#tog-help-command)
* [`tog init`](#tog-init)
* [`tog nuke`](#tog-nuke)
* [`tog ping`](#tog-ping)
* [`tog start`](#tog-start)
* [`tog stop`](#tog-stop)

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

_See code: [src/commands/current.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/current.ts)_

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

_See code: [src/commands/init.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/init.ts)_

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

_See code: [src/commands/nuke.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/nuke.ts)_

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

_See code: [src/commands/ping.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/ping.ts)_

## `tog start`

Start a new time tracking timer

```
USAGE
  $ tog start

DESCRIPTION
  Start a new time tracking timer

EXAMPLES
  $ tog start
```

_See code: [src/commands/start.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/start.ts)_

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

_See code: [src/commands/stop.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/stop.ts)_
<!-- commandsstop -->
