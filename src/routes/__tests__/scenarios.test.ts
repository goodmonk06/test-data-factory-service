import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  DBTargetConfig,
  APITargetConfig,
  DBInsertStep,
  APIRequestStep,
} from '../../types';

describe('Scenario Type Validation', () => {
  describe('DB Target Config', () => {
    it('should validate a proper DB target config', () => {
      const config: DBTargetConfig = {
        connectionString: 'postgresql://user:pass@localhost:5432/db',
      };

      expect(config.connectionString).toBeDefined();
      expect(typeof config.connectionString).toBe('string');
    });
  });

  describe('API Target Config', () => {
    it('should validate a proper API target config', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
        headers: {
          'X-API-Key': 'test-key',
        },
      };

      expect(config.baseUrl).toBeDefined();
      expect(config.headers).toBeDefined();
      expect(config.headers?.['X-API-Key']).toBe('test-key');
    });

    it('should allow API config without headers', () => {
      const config: APITargetConfig = {
        baseUrl: 'https://api.example.com',
      };

      expect(config.baseUrl).toBeDefined();
      expect(config.headers).toBeUndefined();
    });
  });

  describe('DB Steps', () => {
    it('should create a valid insert step', () => {
      const step: DBInsertStep = {
        type: 'db:insert',
        table: 'users',
        values: {
          id: 'user-001',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      expect(step.type).toBe('db:insert');
      expect(step.table).toBe('users');
      expect(step.values).toHaveProperty('id');
    });

    it('should support template variables in values', () => {
      const step: DBInsertStep = {
        type: 'db:insert',
        table: 'orders',
        values: {
          user_id: '{{users_last_insert.id}}',
          total: 100,
        },
      };

      expect(step.values.user_id).toBe('{{users_last_insert.id}}');
      expect(step.values.total).toBe(100);
    });
  });

  describe('API Steps', () => {
    it('should create a valid API request step', () => {
      const step: APIRequestStep = {
        type: 'api:request',
        method: 'POST',
        path: '/v1/users',
        body: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      expect(step.type).toBe('api:request');
      expect(step.method).toBe('POST');
      expect(step.path).toBe('/v1/users');
      expect(step.body).toHaveProperty('email');
    });

    it('should support custom headers in API steps', () => {
      const step: APIRequestStep = {
        type: 'api:request',
        method: 'GET',
        path: '/v1/profile',
        headers: {
          Authorization: 'Bearer {{last_response.data.token}}',
        },
      };

      expect(step.headers).toBeDefined();
      expect(step.headers?.Authorization).toContain('{{last_response.data.token}}');
    });
  });
});

describe('Scenario Structure Validation', () => {
  it('should validate complete DB scenario structure', () => {
    const scenario = {
      name: 'test-scenario',
      description: 'A test scenario',
      targetType: 'DB',
      targetConfigJson: {
        connectionString: 'postgresql://localhost/test',
      },
      stepsJson: [
        {
          type: 'db:insert',
          table: 'users',
          values: { id: '1', name: 'Test' },
        },
      ],
    };

    expect(scenario.name).toBeDefined();
    expect(scenario.targetType).toBe('DB');
    expect(scenario.stepsJson).toHaveLength(1);
    expect(scenario.stepsJson[0].type).toBe('db:insert');
  });

  it('should validate complete API scenario structure', () => {
    const scenario = {
      name: 'api-test-scenario',
      description: 'An API test scenario',
      targetType: 'API',
      targetConfigJson: {
        baseUrl: 'https://api.example.com',
        headers: { 'X-API-Key': 'test' },
      },
      stepsJson: [
        {
          type: 'api:request',
          method: 'POST',
          path: '/users',
          body: { name: 'Test' },
        },
      ],
    };

    expect(scenario.name).toBeDefined();
    expect(scenario.targetType).toBe('API');
    expect(scenario.stepsJson).toHaveLength(1);
    expect(scenario.stepsJson[0].type).toBe('api:request');
  });
});
