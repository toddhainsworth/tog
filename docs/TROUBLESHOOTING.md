# Troubleshooting Guide

This guide helps you solve common issues when developing or using the Toggl CLI.

## 🚨 Quick Fixes

### Command Not Found
```bash
# Problem: ./bin/run.js: command not found
chmod +x ./bin/run.js
```

### Build Issues
```bash
# Problem: TypeScript compilation errors
yarn clean && yarn build

# Problem: Dependencies out of sync
rm -rf node_modules yarn.lock
yarn install
```

### Configuration Issues
```bash
# Problem: No configuration found
./bin/run.js init

# Problem: Invalid API token
./bin/run.js init  # Re-enter token

# Problem: Corrupted config
rm ~/.togrc && ./bin/run.js init
```

## 🔧 Development Issues

### TypeScript Compilation

**Error: `Property 'xyz' does not exist on type`**
```typescript
// ❌ Wrong: Using 'any' type
const data: any = await api.getProjects();

// ✅ Right: Proper typing
interface Project {
  id: number;
  name: string;
}
const data: Project[] = await api.getProjects();
```

**Error: `Cannot find module './xyz.js'`**
```typescript
// ❌ Wrong: Missing .js extension in imports
import { helper } from './utils/helper';

// ✅ Right: Include .js for ES modules
import { helper } from './utils/helper.js';
```

**Error: `error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'`**
```typescript
// Check your type definitions match the actual usage
// Use TypeScript's strict mode to catch these early
```

### Build Performance

**Slow builds (>3 seconds)**
```bash
# Check for large dependencies
yarn why package-name

# Use development mode for rapid iteration
yarn dev  # Uses ts-node, skips build step
```

**Memory issues during build**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" yarn build
```

### Testing Issues

**Tests failing with "Cannot find module"**
```bash
# Ensure build is up to date
yarn build
yarn test

# Check test imports use .js extensions
```

**Tests timing out**
```bash
# Check for async operations without proper waiting
# Ensure API mocks are properly configured
# Increase timeout in test files if needed
```

## 🌐 API Issues

### Authentication Errors

**401 Unauthorized**
```bash
# Check API token validity
./bin/run.js ping

# Re-authenticate
./bin/run.js init
```

**403 Forbidden**
- Check workspace access permissions
- Verify workspace ID in config
- Ensure API token has required scopes

### Network Issues

**Connection timeouts**
```typescript
// Add timeout configuration
const client = axios.create({
  timeout: 10000, // 10 seconds
  retry: 3
});
```

**Rate limiting (429 errors)**
```typescript
// Implement exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        await delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Data Issues

**Missing workspace ID**
```bash
# Check config file
cat ~/.togrc

# Re-run init to select workspace
./bin/run.js init
```

**Pagination not working**
```typescript
// ✅ Ensure proper pagination implementation
async function getAllProjects(workspaceId: number): Promise<Project[]> {
  const allProjects: Project[] = [];
  let page = 1;
  const perPage = 50;

  while (true) {
    const response = await client.get(`/workspaces/${workspaceId}/projects`, {
      params: { page, per_page: perPage }
    });

    const projects = response.data;
    allProjects.push(...projects);

    if (projects.length < perPage) break; // Last page
    page++;
  }

  return allProjects;
}
```

## 🎯 Command-Specific Issues

### Start Command

**No projects found**
- Check workspace has projects: `./bin/run.js projects`
- Verify workspace ID in config
- Check API permissions

**Prompts not showing**
```typescript
// Ensure proper prompt imports
import { select, input } from '@inquirer/prompts';

// Check for conflicting output/console.log statements
```

### Week Command

**Incorrect date ranges**
```typescript
// Ensure UTC date handling for consistency
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

// Use UTC methods for date calculations
const startOfWeek = dayjs().utc().startOf('week');
```

**Performance issues with large datasets**
```typescript
// Use efficient data structures
const projectMap = new Map(projects.map(p => [p.id, p]));

// Instead of Array.find() in loops
entries.forEach(entry => {
  const project = projectMap.get(entry.project_id); // O(1) lookup
});
```

### Reports Commands

**Memory issues with large time ranges**
```typescript
// Implement streaming/chunked processing
async function processEntriesInChunks<T>(
  entries: TimeEntry[],
  processor: (chunk: TimeEntry[]) => T[],
  chunkSize = 100
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    results.push(...processor(chunk));
  }
  return results;
}
```

## 🛠️ Environment Issues

### Node.js Version

**Unsupported Node.js version**
```bash
# Check version
node --version

# Install supported version (18+)
nvm install 18
nvm use 18
```

**ES Modules issues**
```json
// Ensure package.json has:
{
  "type": "module"
}
```

### Package Manager

**Mixed npm/yarn usage**
```bash
# Remove npm artifacts
rm -rf node_modules package-lock.json

# Use yarn consistently
yarn install
```

**Yarn version conflicts**
```bash
# Check version
yarn --version

# Use project's specified version
yarn set version 1.22.22
```

### File Permissions

**Permission denied errors**
```bash
# Fix binary permissions
chmod +x ./bin/run.js

# Fix config file permissions
chmod 600 ~/.togrc
```

## 🔍 Debugging Techniques

### Enable Debug Logging
```bash
# API request/response debugging
DEBUG=axios ./bin/run.js command

# General debugging
DEBUG=* ./bin/run.js command

# Custom debug points
DEBUG=tog:* ./bin/run.js command
```

### TypeScript Debugging
```bash
# Compile with source maps
yarn build --sourceMap

# Use VS Code debugger with launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug CLI",
  "program": "${workspaceFolder}/dist/cli.js",
  "args": ["command", "--arg"],
  "sourceMaps": true
}
```

### Network Debugging
```bash
# Monitor HTTP traffic
sudo tcpdump -i any port 443

# Use curl to test API endpoints
curl -H "Authorization: Basic $(echo -n 'TOKEN:api_token' | base64)" \
     https://api.track.toggl.com/api/v9/me
```

### Performance Profiling
```bash
# Profile startup time
time ./bin/run.js --version

# Profile build time
time yarn build

# Memory usage
node --inspect dist/cli.js command
```

## 🚨 Common Error Messages

### Configuration Errors
```
❌ No configuration found. Please run 'tog init' first.
→ Solution: Run ./bin/run.js init

❌ Invalid API token format
→ Solution: Check token format, re-run init

❌ Failed to load workspace
→ Solution: Verify workspace ID and permissions
```

### API Errors
```
❌ Request failed with status code 401
→ Solution: Check API token validity

❌ Request failed with status code 404
→ Solution: Check resource exists and workspace access

❌ Network Error: connect ECONNREFUSED
→ Solution: Check internet connection and Toggl API status
```

### Build Errors
```
❌ error TS2307: Cannot find module
→ Solution: Check import paths and .js extensions

❌ error TS2345: Argument of type 'X' is not assignable
→ Solution: Fix type mismatches

❌ SyntaxError: Unexpected token
→ Solution: Check for ES module compatibility
```

## 📚 Advanced Debugging

### Custom Logging
```typescript
// Add to commands for detailed debugging
const debug = process.argv.includes('--debug');

if (debug) {
  console.log('Debug: Config loaded:', {
    hasToken: Boolean(config.apiToken),
    workspaceId: config.workspaceId
  });
}
```

### Error Boundaries
```typescript
// Wrap risky operations
async function safeApiCall<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return null;
  }
}
```

### Configuration Validation
```typescript
// Add to commands for config debugging
import { validateConfig } from '../config/validation.js';

try {
  const config = await loadConfig();
  const validation = validateConfig(config);
  if (!validation.success) {
    console.error('Config validation failed:', validation.errors);
  }
} catch (error) {
  console.error('Config error:', error.message);
}
```

## 🆘 Getting Help

### Before Asking for Help
1. ✅ Check this troubleshooting guide
2. ✅ Search existing GitHub issues
3. ✅ Try the quick fixes above
4. ✅ Enable debug logging
5. ✅ Gather error messages and environment info

### Creating a Bug Report
Include:
- **Environment**: OS, Node.js version, yarn version
- **Command**: Exact command that failed
- **Error**: Complete error message
- **Config**: Anonymized config (remove API token)
- **Steps**: Minimal reproduction steps

### Environment Info Script
```bash
# Gather debugging info
echo "Environment Information:"
echo "OS: $(uname -a)"
echo "Node: $(node --version)"
echo "Yarn: $(yarn --version)"
echo "Project version: $(cat package.json | grep version)"
echo "Build status:"
yarn build 2>&1 | head -10
```

## 🔧 Recovery Procedures

### Complete Reset
```bash
# Nuclear option - reset everything
rm -rf node_modules yarn.lock dist ~/.togrc
yarn install
yarn build
./bin/run.js init
```

### Backup and Restore Config
```bash
# Backup config
cp ~/.togrc ~/.togrc.backup

# Restore config
cp ~/.togrc.backup ~/.togrc
```

### Fresh Development Environment
```bash
# Clean slate for development
git stash
git checkout main
git pull origin main
rm -rf node_modules dist
yarn install
yarn build
yarn test
```

---

**Still stuck?** Create an issue with your environment info and we'll help! 🚀