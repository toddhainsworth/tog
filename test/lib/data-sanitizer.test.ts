import {expect} from 'chai'

import {DataSanitizer} from '../../src/lib/data-sanitizer.js'

describe('DataSanitizer', () => {
  describe('sanitize', () => {
    it('should return primitive values unchanged', () => {
      expect(DataSanitizer.sanitize('hello')).to.equal('hello')
      expect(DataSanitizer.sanitize(123)).to.equal(123)
      expect(DataSanitizer.sanitize(true)).to.equal(true)
      expect(DataSanitizer.sanitize(null)).to.equal(null)
      expect(DataSanitizer.sanitize(undefined)).to.equal(undefined)
    })

    it('should mask sensitive keys', () => {
      const data = {
        apiToken: 'abcdef123456789',
        description: 'My task',
        user: 'john@example.com'
      }

      const result = DataSanitizer.sanitize(data) as Record<string, unknown>
      expect(result.apiToken).to.equal('***6789')
      expect(result.description).to.equal('My task')
      expect(result.user).to.equal('john@example.com')
    })

    it('should mask various sensitive key patterns', () => {
      const data = {
        api_token: 'token123456789',
        authorization: 'Bearer xyz123456',
        key: 'k',
        password: 'secretpass',
        secret: 'sh',
      }

      const result = DataSanitizer.sanitize(data) as Record<string, unknown>
      expect(result.api_token).to.equal('***6789')
      expect(result.password).to.equal('***pass')
      expect(result.authorization).to.equal('***3456')
      expect(result.secret).to.equal('***') // Short values
      expect(result.key).to.equal('***')
    })

    it('should sanitize nested objects', () => {
      const data = {
        config: {
          token: 'token987654321'
        },
        user: {
          apiToken: 'secret123456789',
          name: 'John'
        }
      }

      const result = DataSanitizer.sanitize(data) as {config: {token: string}; user: {apiToken: string; name: string;};}
      expect(result.user.name).to.equal('John')
      expect(result.user.apiToken).to.equal('***6789')
      expect(result.config.token).to.equal('***4321')
    })

    it('should sanitize arrays', () => {
      const data = [
        { name: 'item1', token: 'token123456789' },
        { apiToken: 'secret987654321', name: 'item2' }
      ]

      const result = DataSanitizer.sanitize(data) as Array<{apiToken?: string; name: string; token?: string;}>
      expect(result[0].name).to.equal('item1')
      expect(result[0].token).to.equal('***6789')
      expect(result[1].name).to.equal('item2')
      expect(result[1].apiToken).to.equal('***4321')
    })

    it('should handle case insensitive matching', () => {
      const data = {
        API_TOKEN: 'secret987654321',
        ApiToken: 'token123456789',
        Password: 'mypassword'
      }

      const result = DataSanitizer.sanitize(data) as Record<string, unknown>
      expect(result.ApiToken).to.equal('***6789')
      expect(result.API_TOKEN).to.equal('***4321')
      expect(result.Password).to.equal('***word')
    })

    it('should handle complex nested structures', () => {
      const data = {
        settings: {
          api: {
            timeout: 5000,
            token: 'settings123456789'
          }
        },
        users: [
          {
            id: 1,
            profile: {
              auth: {
                apiToken: 'secret123456789',
                refreshToken: 'refresh987654321'
              },
              name: 'John'
            }
          }
        ]
      }

      const result = DataSanitizer.sanitize(data) as {
        settings: {api: {timeout: number; token: string;}}
        users: Array<{
          id: number;
          profile: {
            auth: {apiToken: string; refreshToken: string}
            name: string;
          }
        }>;
      }
      expect(result.users[0].id).to.equal(1)
      expect(result.users[0].profile.name).to.equal('John')
      expect(result.users[0].profile.auth.apiToken).to.equal('***6789')
      expect(result.users[0].profile.auth.refreshToken).to.equal('***4321')
      expect(result.settings.api.token).to.equal('***6789')
      expect(result.settings.api.timeout).to.equal(5000)
    })
  })
})