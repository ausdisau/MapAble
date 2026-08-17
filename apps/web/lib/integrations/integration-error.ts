export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly integrationKey?: string
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

export class IntegrationDisabledError extends IntegrationError {
  constructor(integrationKey: string) {
    super(
      `Integration "${integrationKey}" is disabled or not configured.`,
      "INTEGRATION_DISABLED",
      integrationKey
    );
    this.name = "IntegrationDisabledError";
  }
}

export class IntegrationHealthError extends IntegrationError {
  constructor(integrationKey: string, message: string) {
    super(message, "INTEGRATION_HEALTH_FAILED", integrationKey);
    this.name = "IntegrationHealthError";
  }
}

export class IntegrationSafetyBlockedError extends IntegrationError {
  constructor(eventKey: string) {
    super(
      `Event "${eventKey}" cannot be sent via low-risk automation.`,
      "INTEGRATION_SAFETY_BLOCKED"
    );
    this.name = "IntegrationSafetyBlockedError";
  }
}
