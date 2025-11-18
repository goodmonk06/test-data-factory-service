import { IMetricsAdapter } from '../../types';

interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

/**
 * In-memory metrics adapter (default implementation)
 * In production, replace with Prometheus, DataDog, or CloudWatch implementation
 */
export class InMemoryMetricsAdapter implements IMetricsAdapter {
  private counters: Map<string, MetricValue[]> = new Map();
  private gauges: Map<string, MetricValue> = new Map();
  private histograms: Map<string, MetricValue[]> = new Map();
  private timers: Map<string, MetricValue[]> = new Map();

  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, []);
    }
    this.counters.get(name)!.push({
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.gauges.set(name, {
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push({
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordTimer(name: string, durationMs: number, labels?: Record<string, string>): void {
    if (!this.timers.has(name)) {
      this.timers.set(name, []);
    }
    this.timers.get(name)!.push({
      value: durationMs,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Get all metrics (for debugging/testing)
   */
  getAllMetrics(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms),
      timers: Object.fromEntries(this.timers),
    };
  }

  /**
   * Get summary statistics for a metric
   */
  getSummary(name: string): Record<string, number> | null {
    const values = this.histograms.get(name) || this.timers.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const nums = values.map(v => v.value);
    const sorted = nums.sort((a, b) => a - b);

    return {
      count: nums.length,
      sum: nums.reduce((a, b) => a + b, 0),
      mean: nums.reduce((a, b) => a + b, 0) / nums.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
  }
}

/**
 * Console metrics adapter - logs metrics to console
 */
export class ConsoleMetricsAdapter implements IMetricsAdapter {
  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    console.log(`[METRIC:COUNTER] ${name}=${value}`, labels || '');
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    console.log(`[METRIC:GAUGE] ${name}=${value}`, labels || '');
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    console.log(`[METRIC:HISTOGRAM] ${name}=${value}`, labels || '');
  }

  recordTimer(name: string, durationMs: number, labels?: Record<string, string>): void {
    console.log(`[METRIC:TIMER] ${name}=${durationMs}ms`, labels || '');
  }
}

// Singleton instance
export const metrics = new InMemoryMetricsAdapter();
