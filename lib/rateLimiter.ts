const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (now - record.firstAttempt > LOCKOUT_MS) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((LOCKOUT_MS - (now - record.firstAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

export function resetRateLimit(identifier: string) {
  attempts.delete(identifier);
}

export function getRemainingAttempts(identifier: string): number {
  const record = attempts.get(identifier);
  if (!record) return MAX_ATTEMPTS;
  if (Date.now() - record.firstAttempt > LOCKOUT_MS) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}
