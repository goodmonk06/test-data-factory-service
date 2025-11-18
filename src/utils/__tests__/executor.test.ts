import { describe, it, expect } from 'vitest';
import { Scenario, Step } from '../../types';

describe('ScenarioExecutor Types', () => {
  describe('Scenario validation', () => {
    it('should have all required scenario fields', () => {
      const scenario: Scenario = {
        id: 'scenario-001',
        name: 'test-scenario',
        description: 'Test description',
        targetType: 'DB',
        targetConfigJson: {
          connectionString: 'postgresql://localhost/test',
        },
        stepsJson: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(scenario.id).toBeDefined();
      expect(scenario.name).toBeDefined();
      expect(scenario.targetType).toBeDefined();
      expect(scenario.targetConfigJson).toBeDefined();
      expect(scenario.stepsJson).toBeDefined();
      expect(Array.isArray(scenario.stepsJson)).toBe(true);
    });

    it('should support multi-step scenarios', () => {
      const steps: Step[] = [
        {
          type: 'db:insert',
          table: 'users',
          values: { id: '1', name: 'User 1' },
        },
        {
          type: 'db:insert',
          table: 'posts',
          values: { user_id: '{{users_last_insert.id}}', title: 'Post 1' },
        },
        {
          type: 'db:update',
          table: 'users',
          where: { id: '1' },
          values: { updated: true },
        },
      ];

      expect(steps).toHaveLength(3);
      expect(steps[0].type).toBe('db:insert');
      expect(steps[1].type).toBe('db:insert');
      expect(steps[2].type).toBe('db:update');
    });
  });

  describe('Step chaining with variables', () => {
    it('should support variable references between steps', () => {
      const steps: Step[] = [
        {
          type: 'db:insert',
          table: 'tenants',
          values: { name: 'Acme Corp' },
        },
        {
          type: 'db:insert',
          table: 'users',
          values: {
            tenant_id: '{{tenants_last_insert.id}}',
            email: 'admin@acme.com',
          },
        },
        {
          type: 'db:insert',
          table: 'projects',
          values: {
            tenant_id: '{{tenants_last_insert.id}}',
            owner_id: '{{users_last_insert.id}}',
            name: 'Project 1',
          },
        },
      ];

      // Verify template variable syntax
      const step2 = steps[1] as any;
      const step3 = steps[2] as any;

      expect(step2.values.tenant_id).toMatch(/\{\{.*\}\}/);
      expect(step3.values.tenant_id).toMatch(/\{\{.*\}\}/);
      expect(step3.values.owner_id).toMatch(/\{\{.*\}\}/);
    });

    it('should support nested variable paths', () => {
      const step: Step = {
        type: 'api:request',
        method: 'GET',
        path: '/users/{{last_response.data.user.id}}',
        headers: {
          Authorization: 'Bearer {{last_response.data.token}}',
        },
      };

      const apiStep = step as any;
      expect(apiStep.path).toContain('{{last_response.data.user.id}}');
      expect(apiStep.headers.Authorization).toContain('{{last_response.data.token}}');
    });
  });
});
