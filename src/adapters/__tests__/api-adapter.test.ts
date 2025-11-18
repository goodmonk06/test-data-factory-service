import { describe, it, expect, vi } from 'vitest';
import { APIAdapter } from '../api-adapter';
import { APITargetConfig, StepExecutionContext } from '../../types';

describe('APIAdapter', () => {
  describe('interpolateString', () => {
    it('should interpolate single variables in strings', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      const adapter = new APIAdapter(config);
      const context: StepExecutionContext = {
        variables: {
          user_id: '123',
          tenant: 'acme',
        },
        log: vi.fn(),
      };

      // Access private method for testing
      const interpolateString = (adapter as any).interpolateString.bind(adapter);

      const result = interpolateString('/users/{{user_id}}/tenant/{{tenant}}', context.variables);

      expect(result).toBe('/users/123/tenant/acme');
    });

    it('should handle nested object paths', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      const adapter = new APIAdapter(config);
      const context: StepExecutionContext = {
        variables: {
          last_response: {
            data: {
              token: 'abc123',
            },
          },
        },
        log: vi.fn(),
      };

      const interpolateString = (adapter as any).interpolateString.bind(adapter);

      const result = interpolateString('Bearer {{last_response.data.token}}', context.variables);

      expect(result).toBe('Bearer abc123');
    });

    it('should leave non-template strings unchanged', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      const adapter = new APIAdapter(config);
      const context: StepExecutionContext = {
        variables: {},
        log: vi.fn(),
      };

      const interpolateString = (adapter as any).interpolateString.bind(adapter);

      const result = interpolateString('/static/path', context.variables);

      expect(result).toBe('/static/path');
    });
  });

  describe('interpolateBody', () => {
    it('should interpolate values in nested objects', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      const adapter = new APIAdapter(config);
      const context: StepExecutionContext = {
        variables: {
          user_id: '456',
          email: 'test@example.com',
        },
        log: vi.fn(),
      };

      const interpolateBody = (adapter as any).interpolateBody.bind(adapter);

      const body = {
        userId: '{{user_id}}',
        contact: {
          email: '{{email}}',
        },
        static: 'value',
      };

      const result = interpolateBody(body, context.variables);

      expect(result).toEqual({
        userId: '456',
        contact: {
          email: 'test@example.com',
        },
        static: 'value',
      });
    });

    it('should interpolate values in arrays', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      const adapter = new APIAdapter(config);
      const context: StepExecutionContext = {
        variables: {
          tag1: 'important',
          tag2: 'urgent',
        },
        log: vi.fn(),
      };

      const interpolateBody = (adapter as any).interpolateBody.bind(adapter);

      const body = {
        tags: ['{{tag1}}', '{{tag2}}', 'static'],
      };

      const result = interpolateBody(body, context.variables);

      expect(result).toEqual({
        tags: ['important', 'urgent', 'static'],
      });
    });
  });

  describe('buildUrl', () => {
    it('should combine baseUrl and path', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      const adapter = new APIAdapter(config);
      const context: StepExecutionContext = {
        variables: {},
        log: vi.fn(),
      };

      const buildUrl = (adapter as any).buildUrl.bind(adapter);

      const result = buildUrl('/v1/users', context.variables);

      expect(result).toBe('https://api.example.com/v1/users');
    });

    it('should interpolate variables in the path', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      const adapter = new APIAdapter(config);
      const context: StepExecutionContext = {
        variables: {
          user_id: '789',
        },
        log: vi.fn(),
      };

      const buildUrl = (adapter as any).buildUrl.bind(adapter);

      const result = buildUrl('/v1/users/{{user_id}}', context.variables);

      expect(result).toBe('https://api.example.com/v1/users/789');
    });
  });
});
