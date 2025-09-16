import { expect } from 'chai';

import { TogglClient } from '../../src/lib/toggl-client.js';

describe('TogglClient', () => {
  describe('constructor', () => {
    it('should create an instance with an API token', () => {
      const client = new TogglClient('test-token');
      expect(client).to.be.instanceOf(TogglClient);
    });
  });

  describe('ping', () => {
    it('should return false for invalid API token', async function() {
      // Increase timeout for network request
      this.timeout(10_000);
      
      const client = new TogglClient('invalid-token');
      const result = await client.ping();
      expect(result).to.be.false;
    });

    it('should return false for empty API token', async function() {
      // Increase timeout for network request
      this.timeout(10_000);
      
      const client = new TogglClient('');
      const result = await client.ping();
      expect(result).to.be.false;
    });

    // Note: We don't test with a valid API token here as that would require
    // actual credentials and would make the test dependent on external factors.
    // In a real scenario, you might use environment variables for integration tests
    // or mock the HTTP client for unit tests.
  });
});