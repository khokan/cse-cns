# Domain Rules

Enterprise financial platform.

## Priorities

Correctness
Reliability
Auditability
Performance
Security

## Principles

- Money calculations must be deterministic.
- Never lose data.
- Every operation must be traceable.
- Business events should be logged.
- Prefer immutable records for financial history.
- Idempotent operations.
- Retry transient failures safely.

## Settlement

- Queue long-running tasks.
- Atomic database updates.
- Transaction boundaries explicit.
- Rollback on failure.
- Retry FTP/report generation separately.

## Reports

- Generate asynchronously.
- Stream large exports.
- Avoid loading entire datasets into memory.
- Track progress.
- Store report metadata.

## Audit

Capture:

- who
- when
- what
- previous value
- new value

## Security

Never expose:

- credentials
- tokens
- secrets
- PII

## Errors

Business errors != System errors.

Handle separately.