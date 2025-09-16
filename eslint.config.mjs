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
      // Disable new-cap to allow openapi-fetch HTTP method naming (GET, POST, etc.)
      'new-cap': 'off',
      // Disable all perfectionist rules
      'perfectionist/*': 'off',
    }
  }
]
