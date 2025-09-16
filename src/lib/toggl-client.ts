import createClient from 'openapi-fetch'

import type {paths} from '../types/toggl.js'

export class TogglClient {
  private client: ReturnType<typeof createClient<paths>>

  constructor(apiToken: string) {
    this.client = createClient<paths>({
      baseUrl: 'https://api.track.toggl.com/api/v9',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`, 'utf8').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.client.GET('/me', {
        params: {
          query: {},
        },
      })

      if (response.error) {
        return false
      }

      // Check if the response contains a valid user ID
      const userData = response.data as {id?: number}
      return userData?.id !== null && userData?.id !== undefined && userData.id > 0
    } catch {
      // Network or other errors
      return false
    }
  }
}
