import { APITargetConfig, APIStep, StepExecutionContext } from '../types';

export class APIAdapter {
  private config: APITargetConfig;

  constructor(config: APITargetConfig) {
    this.config = config;
  }

  async executeStep(step: APIStep, context: StepExecutionContext): Promise<void> {
    if (step.type !== 'api:request') {
      throw new Error(`Unknown API step type: ${(step as any).type}`);
    }

    const url = this.buildUrl(step.path, context.variables);
    const headers = this.buildHeaders(step.headers, context.variables);
    const body = this.interpolateBody(step.body, context.variables);

    context.log(`Executing ${step.method} request to: ${url}`);
    if (body) {
      context.log(`Request body: ${JSON.stringify(body, null, 2)}`);
    }

    const options: RequestInit = {
      method: step.method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && step.method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    context.log(`Response status: ${response.status} ${response.statusText}`);

    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
      context.log(`Response body: ${JSON.stringify(responseData, null, 2)}`);
    } else {
      responseData = await response.text();
      context.log(`Response text: ${responseData}`);
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}\n${JSON.stringify(responseData)}`
      );
    }

    // Store the response in variables for future steps
    context.variables.last_response = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    };
  }

  private buildUrl(path: string, variables: Record<string, any>): string {
    const interpolatedPath = this.interpolateString(path, variables);
    return `${this.config.baseUrl}${interpolatedPath}`;
  }

  private buildHeaders(
    headers: Record<string, string> | undefined,
    variables: Record<string, any>
  ): Record<string, string> {
    const result: Record<string, string> = { ...this.config.headers };

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        result[key] = this.interpolateString(value, variables);
      }
    }

    return result;
  }

  private interpolateBody(body: any, variables: Record<string, any>): any {
    if (!body) return body;

    if (typeof body === 'string') {
      return this.interpolateString(body, variables);
    }

    if (Array.isArray(body)) {
      return body.map((item) => this.interpolateBody(item, variables));
    }

    if (typeof body === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(body)) {
        result[key] = this.interpolateBody(value, variables);
      }
      return result;
    }

    return body;
  }

  private interpolateString(str: string, variables: Record<string, any>): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
      const parts = varPath.trim().split('.');
      let value = variables;

      for (const part of parts) {
        value = value?.[part];
      }

      return value !== undefined ? String(value) : match;
    });
  }
}
