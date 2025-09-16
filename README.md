tog
=================

Toggl CLI


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/tog.svg)](https://npmjs.org/package/tog)
[![Downloads/week](https://img.shields.io/npm/dw/tog.svg)](https://npmjs.org/package/tog)


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
* [`tog hello PERSON`](#tog-hello-person)
* [`tog hello world`](#tog-hello-world)
* [`tog help [COMMAND]`](#tog-help-command)
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

## `tog hello PERSON`

Say hello

```
USAGE
  $ tog hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ tog hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/hello/index.ts)_

## `tog hello world`

Say hello world

```
USAGE
  $ tog hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ tog hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/hello/world.ts)_

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
<!-- commandsstop -->
