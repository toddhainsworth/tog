# Toggl CLI

A simple, fast command-line interface for Toggl time tracking built with TypeScript and Commander.js.

[![Build Status](https://github.com/toddhainsworth/tog/workflows/CI/badge.svg)](https://github.com/toddhainsworth/tog/actions)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## ✨ Features

- **🚀 Fast & Simple**: Single-file commands, sub-second builds
- **🎯 Interactive**: Smart prompts for projects, tasks, and timers
- **📊 Rich Reports**: Daily, weekly summaries with project breakdowns
- **🔧 Developer-Friendly**: Type-safe, well-documented, easy to extend
- **⚡ Performance**: Optimized API calls with efficient pagination and intelligent caching

## 🚀 Quick Start

### For Users

```bash
# Install
git clone https://github.com/toddhainsworth/tog.git
cd tog
yarn install && yarn build

# Setup your API token
./bin/run.js init

# Start tracking
./bin/run.js start
./bin/run.js current
./bin/run.js week
```

### For Developers

```bash
# Get started in 5 minutes
git clone https://github.com/toddhainsworth/tog.git
cd tog
yarn install && yarn build
./bin/run.js --help

# Make your first change
# Edit src/commands/ping.ts - change the success message
yarn build && ./bin/run.js ping

# See our comprehensive guides:
```

📚 **[→ Developer Onboarding Guide](docs/ONBOARDING.md)** - Complete step-by-step setup with architecture overview
🔧 **[→ Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Solutions to common development and usage issues

## 📋 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Setup API token and workspace | `tog init` |
| `start` | Start new timer (interactive) | `tog start` |
| `current` | Show running timer | `tog current` |
| `stop` | Stop current timer | `tog stop` |
| `continue` | Restart recent timer | `tog continue` |
| `edit` | Modify current timer | `tog edit` |
| `today` | Today's time summary | `tog today` |
| `week` | Weekly summary | `tog week --last` |
| `projects` | List all projects | `tog projects` |
| `tasks` | List all tasks | `tog tasks` |
| `clients` | List clients | `tog clients --tree` |

## 🏗️ Architecture

This CLI follows a **simplified single-file command pattern** for maximum clarity:

```
src/
├── commands/          # One file per command (self-contained)
├── utils/            # Shared utilities (time, formatting, caching)
├── config/           # Configuration management
├── api/              # Toggl API client with intelligent caching
└── cli.ts           # Main entry point
```

**Key Principles:**
- 🎯 **Single-file commands** - Everything for a command in one file
- 🛡️ **Type safety** - Zero `any` types, comprehensive validation
- ⚡ **Performance** - Parallel API calls, efficient data structures
- 🔧 **Maintainability** - Clear patterns, excellent documentation

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **🏃‍♂️ Quick Start**: Follow our [5-minute setup guide](docs/ONBOARDING.md#quick-start-5-minutes)
2. **📖 Learn the Patterns**: Check our [architecture overview](docs/ONBOARDING.md#architecture-overview)
3. **🍳 Copy Examples**: Use our [cookbook recipes](docs/COOKBOOK.md) for common tasks
4. **🐛 Fix Issues**: Look for `good first issue` labels
5. **💡 Add Features**: Follow our [command pattern guide](docs/COOKBOOK.md#command-patterns)

**First-time contributors can make meaningful changes within 2-4 hours** using our guides.

### Development Scripts

```bash
yarn build        # Compile TypeScript (~1s)
yarn test         # Run tests (<2s)
yarn verify       # Full quality check (~5s)
yarn dev          # Development mode with ts-node
yarn clean        # Remove build artifacts
```

## 📊 Performance

- **Build time**: <1s (target: <3s) ✅
- **Test time**: <2s (target: <5s) ✅
- **CLI startup**: <100ms ✅
- **Commands**: Instant response with loading indicators

## 🛠️ Technology Stack

- **[Commander.js](https://github.com/tj/commander.js)** - CLI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[ArkType](https://arktype.io/)** - Runtime validation
- **[@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js/)** - Interactive prompts
- **[Axios](https://axios-http.com/)** - HTTP client for Toggl API
- **[Day.js](https://day.js.org/)** - Date manipulation

## 📚 Documentation

- **[Developer Onboarding](docs/ONBOARDING.md)** - Complete guide for new contributors with architecture overview
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common development and usage issues with solutions
- **[Architecture Deep Dive](docs/AI_DEVELOPMENT.md)** - Development process and decisions
- **[Release Process](docs/RELEASE.md)** - How to cut releases

## 🎯 Project Status

**Current Version**: 0.6.0
**Phase**: Architecture Simplification Complete ✅
**Focus**: Documentation and Developer Experience

## 📄 License

MIT - see [LICENSE](LICENSE) file for details

---

**Built with ❤️ using AI-assisted development practices**