# Toggl CLI

A simple command-line interface for Toggl time tracking.

## Features

- **Timer Management**: Start, stop, and view running timers
- **Interactive Prompts**: Project and task selection without complex flags
- **Real-time Display**: Live elapsed time and timer details
- **API Integration**: Direct connection to Toggl Track API

## Installation

```bash
# Clone and build
git clone https://github.com/toddhainsworth/tog.git
cd tog
yarn install
yarn build
```

## Setup

Set up your Toggl API token:

```bash
# You'll need to implement the init command or manually create ~/.togrc
echo '{"apiToken":"your_api_token_here"}' > ~/.togrc
```

## Usage

```bash
# Test connection
./bin/run.js ping

# View current timer
./bin/run.js current

# Start a new timer (interactive)
./bin/run.js start

# Stop running timer
./bin/run.js stop

# Show all commands
./bin/run.js --help
```

## Development

```bash
# Run tests
yarn test

# Build
yarn build

# Development mode
yarn dev
```

## AI-Assisted Development

This project was built using AI-assisted development practices. See [AI Development Documentation](docs/AI_DEVELOPMENT.md) for details on the development process, architecture decisions, and lessons learned.

## License

MIT