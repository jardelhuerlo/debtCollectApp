export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "").slice(0, 500);
}

export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().slice(0, 255);
}

export function sanitizeNumber(input: string | number): number {
  const num = typeof input === "string" ? parseFloat(input) : input;
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
}

export function sanitizeNote(input: string): string {
  return input.trim().replace(/[<>]/g, "").slice(0, 1000);
}
