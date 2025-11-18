import { Pool, PoolClient } from 'pg';
import {
  DBTargetConfig,
  DBStep,
  DBInsertStep,
  DBUpdateStep,
  DBDeleteStep,
  StepExecutionContext,
} from '../types';

export class DBAdapter {
  private pool: Pool;

  constructor(config: DBTargetConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
    });
  }

  async executeStep(step: DBStep, context: StepExecutionContext): Promise<void> {
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();

      switch (step.type) {
        case 'db:insert':
          await this.executeInsert(client, step, context);
          break;
        case 'db:update':
          await this.executeUpdate(client, step, context);
          break;
        case 'db:delete':
          await this.executeDelete(client, step, context);
          break;
        default:
          throw new Error(`Unknown DB step type: ${(step as any).type}`);
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  private async executeInsert(
    client: PoolClient,
    step: DBInsertStep,
    context: StepExecutionContext
  ): Promise<void> {
    const values = this.interpolateValues(step.values, context.variables);
    const columns = Object.keys(values);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const valueArray = Object.values(values);

    const query = `
      INSERT INTO ${step.table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    context.log(`Executing INSERT: ${query}`);
    context.log(`Values: ${JSON.stringify(valueArray)}`);

    const result = await client.query(query, valueArray);

    // Store the inserted row in variables for future steps
    if (result.rows[0]) {
      context.variables[`${step.table}_last_insert`] = result.rows[0];
      context.log(`Inserted row: ${JSON.stringify(result.rows[0])}`);
    }
  }

  private async executeUpdate(
    client: PoolClient,
    step: DBUpdateStep,
    context: StepExecutionContext
  ): Promise<void> {
    const values = this.interpolateValues(step.values, context.variables);
    const where = this.interpolateValues(step.where, context.variables);

    const setColumns = Object.keys(values);
    const whereColumns = Object.keys(where);

    const setPlaceholders = setColumns.map((col, i) => `${col} = $${i + 1}`);
    const wherePlaceholders = whereColumns.map(
      (col, i) => `${col} = $${setColumns.length + i + 1}`
    );

    const valueArray = [...Object.values(values), ...Object.values(where)];

    const query = `
      UPDATE ${step.table}
      SET ${setPlaceholders.join(', ')}
      WHERE ${wherePlaceholders.join(' AND ')}
      RETURNING *
    `;

    context.log(`Executing UPDATE: ${query}`);
    context.log(`Values: ${JSON.stringify(valueArray)}`);

    const result = await client.query(query, valueArray);
    context.log(`Updated ${result.rowCount} row(s)`);
  }

  private async executeDelete(
    client: PoolClient,
    step: DBDeleteStep,
    context: StepExecutionContext
  ): Promise<void> {
    const where = this.interpolateValues(step.where, context.variables);
    const whereColumns = Object.keys(where);
    const wherePlaceholders = whereColumns.map((col, i) => `${col} = $${i + 1}`);
    const valueArray = Object.values(where);

    const query = `
      DELETE FROM ${step.table}
      WHERE ${wherePlaceholders.join(' AND ')}
    `;

    context.log(`Executing DELETE: ${query}`);
    context.log(`Values: ${JSON.stringify(valueArray)}`);

    const result = await client.query(query, valueArray);
    context.log(`Deleted ${result.rowCount} row(s)`);
  }

  private interpolateValues(
    values: Record<string, any>,
    variables: Record<string, any>
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(values)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Template variable like {{variable_name}}
        const varName = value.slice(2, -2).trim();
        const parts = varName.split('.');

        let resolvedValue = variables;
        for (const part of parts) {
          resolvedValue = resolvedValue?.[part];
        }

        result[key] = resolvedValue;
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
