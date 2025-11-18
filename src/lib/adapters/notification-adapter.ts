import {
  INotificationAdapter,
  NotificationMessage,
  EnhancedScenarioRun,
  EnhancedScenario,
} from '../../types';

/**
 * Console-based notification adapter (default implementation)
 * In production, replace with Slack, email, or webhook implementation
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async sendNotification(message: NotificationMessage): Promise<void> {
    const timestamp = new Date().toISOString();
    const icon = this.getSeverityIcon(message.severity);

    console.log(`\n${icon} [${message.severity.toUpperCase()}] ${timestamp}`);
    console.log(`Title: ${message.title}`);
    console.log(`Body: ${message.body}`);

    if (message.metadata) {
      console.log(`Metadata:`, JSON.stringify(message.metadata, null, 2));
    }
    console.log('');
  }

  async sendExecutionAlert(
    run: EnhancedScenarioRun,
    scenario: EnhancedScenario
  ): Promise<void> {
    const severity = run.status === 'SUCCESS' ? 'success' : run.status === 'FAILED' ? 'error' : 'info';

    await this.sendNotification({
      title: `Scenario Execution ${run.status}`,
      body: `Scenario "${scenario.name}" ${run.status.toLowerCase()}`,
      severity,
      metadata: {
        scenarioId: scenario.id,
        runId: run.id,
        duration: run.duration,
        triggeredBy: run.triggeredBy,
      },
    });
  }

  private getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅',
    };
    return icons[severity] || 'ℹ️';
  }
}

/**
 * No-op notification adapter for testing or when notifications are disabled
 */
export class NoOpNotificationAdapter implements INotificationAdapter {
  async sendNotification(_message: NotificationMessage): Promise<void> {
    // Do nothing
  }

  async sendExecutionAlert(
    _run: EnhancedScenarioRun,
    _scenario: EnhancedScenario
  ): Promise<void> {
    // Do nothing
  }
}
