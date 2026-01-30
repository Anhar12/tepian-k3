export class EmailError extends Error {
  _tag = "EmailError";
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export class SendEmailFailedError extends EmailError {
  readonly _tag = "SendEmailFailedError";
  constructor(message: string, cause?: unknown) {
    super(`Send email failed: ${message}`, cause);
    this.name = "SendEmailFailedError";
  }
}

export class EmailVerificationFailedError extends EmailError {
  readonly _tag = "EmailVerificationFailedError";
  constructor(message: string, cause?: unknown) {
    super(`Email verification failed: ${message}`, cause);
    this.name = "EmailVerificationFailedError";
  }
}
