import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath), 
  ...oclif, 
  prettier,
  {
    ignores: ['src/types/toggl.d.ts'],
  },
  {
    rules: {
      // STRICT TYPE SAFETY RULES - NO EXCEPTIONS
      // Ensure we use safe type assertions
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never'
      }],
      // Ban 'any' types completely - use proper typing instead
      '@typescript-eslint/no-explicit-any': 'error',
      // Ban non-null assertion operator (!) - use proper null checks instead
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Disable camelcase to allow API property names like workspace_id, project_id
      'camelcase': 'off',
      // Disable new-cap to allow openapi-fetch HTTP method naming (GET, POST, etc.)
      'new-cap': 'off',
      // Disable all perfectionist rules
      'perfectionist/*': 'off',
    }
  },
  {
    files: ['loader.mjs'],
    rules: {
      // Allow experimental module.register for Node.js 22+ loader
      'n/no-unsupported-features/node-builtins': 'off',
    }
  }
]
