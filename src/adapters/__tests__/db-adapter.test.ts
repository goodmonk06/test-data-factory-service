import { describe, it, expect, vi } from 'vitest';
import { DBAdapter } from '../db-adapter';
import { DBTargetConfig, StepExecutionContext } from '../../types';

describe('DBAdapter', () => {
  describe('interpolateValues', () => {
    it('should interpolate template variables correctly', () => {
      const config: DBTargetConfig = {
        connectionString: 'postgresql://test',
      };

      const adapter = new DBAdapter(config);
      const context: StepExecutionContext = {
        variables: {
          users_last_insert: { id: '123', name: 'Test User' },
          tenant_id: 'tenant-001',
        },
        log: vi.fn(),
      };

      // Use type assertion to access private method for testing
      const interpolateValues = (adapter as any).interpolateValues.bind(adapter);

      const values = {
        id: 'static-id',
        user_id: '{{users_last_insert.id}}',
        tenant: '{{tenant_id}}',
        name: '{{users_last_insert.name}}',
      };

      const result = interpolateValues(values, context.variables);

      expect(result).toEqual({
        id: 'static-id',
        user_id: '123',
        tenant: 'tenant-001',
        name: 'Test User',
      });
    });

    it('should handle nested variable paths', () => {
      const config: DBTargetConfig = {
        connectionString: 'postgresql://test',
      };

      const adapter = new DBAdapter(config);
      const context: StepExecutionContext = {
        variables: {
          last_response: {
            data: {
              user: {
                id: 'deep-id',
              },
            },
          },
        },
        log: vi.fn(),
      };

      const interpolateValues = (adapter as any).interpolateValues.bind(adapter);

      const values = {
        user_id: '{{last_response.data.user.id}}',
      };

      const result = interpolateValues(values, context.variables);

      expect(result).toEqual({
        user_id: 'deep-id',
      });
    });

    it('should leave non-template values unchanged', () => {
      const config: DBTargetConfig = {
        connectionString: 'postgresql://test',
      };

      const adapter = new DBAdapter(config);
      const context: StepExecutionContext = {
        variables: {},
        log: vi.fn(),
      };

      const interpolateValues = (adapter as any).interpolateValues.bind(adapter);

      const values = {
        name: 'Static Name',
        count: 42,
        active: true,
      };

      const result = interpolateValues(values, context.variables);

      expect(result).toEqual(values);
    });

    it('should handle undefined variables gracefully', () => {
      const config: DBTargetConfig = {
        connectionString: 'postgresql://test',
      };

      const adapter = new DBAdapter(config);
      const context: StepExecutionContext = {
        variables: {},
        log: vi.fn(),
      };

      const interpolateValues = (adapter as any).interpolateValues.bind(adapter);

      const values = {
        missing: '{{non_existent_var}}',
      };

      const result = interpolateValues(values, context.variables);

      expect(result.missing).toBeUndefined();
    });
  });
});
